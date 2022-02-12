import json
import time
import traceback

from server.db import JeopartyDb, JeopartyRedis

WHILE_LOOP_SLEEP = 1
GAME_START_TIME_LIMIT = 3600
CLUE_PREPARE_TIME = 3
RESPONSE_TIME_LIMIT = 50
GRADING_TIME_LIMIT = 15


#####
## Main loop
#####


def game_loop(room_id):
    try:

        db = JeopartyDb()

        redis_db = JeopartyRedis()

        wait_for_game_to_be_started(db, room_id)

        source_game_id = get_source_game_id_for_room(db, room_id)

        for round_type in ["single", "double", "final"]:
            while next_clue_id := get_next_clue_id(
                    db, room_id, source_game_id, round_type
            ):
                run_next_clue(next_clue_id, db, room_id, redis_db)

    except Exception:
        print(traceback.format_exc())


#####
## Helpers
#####


def get_source_game_id_for_room(db, room_id):
    source_game_query = f"""
        SELECT source_game_id FROM {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM} WHERE id = %s;
    """
    source_game_row = db.execute_and_fetch(
        source_game_query,
        (room_id,),
        do_fetch_one=True,
    )
    source_game_id = dict(source_game_row)["source_game_id"]
    return source_game_id


def run_next_clue(clue_id, db, room_id, redis_db):
    room_update_query = f"""
        UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM}
        SET current_clue_id = %s, current_clue_stage = 'preparing'
        WHERE id = %s;
    """
    db.execute_and_commit(room_update_query, (clue_id, room_id))
    _send_room_update_to_redis(redis_db, room_id)

    time.sleep(CLUE_PREPARE_TIME)

    room_update_query = f"""
        UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM}
        SET current_clue_id = %s, current_clue_stage = 'answering'
        WHERE id = %s;
    """
    db.execute_and_commit(room_update_query, (clue_id, room_id))
    _send_room_update_to_redis(redis_db, room_id)

    wait_for_players_to_submit(db, room_id, clue_id, redis_db)

    room_update_query = f"""
        UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM} SET current_clue_stage = 'grading' WHERE id = %s;
    """
    db.execute_and_commit(room_update_query, (room_id,))
    _send_room_update_to_redis(redis_db, room_id)

    wait_for_players_to_grade(db, room_id, clue_id, redis_db)

    room_update_query = f"""
        UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM} SET current_clue_stage = 'finished' WHERE id = %s;
    """
    db.execute_and_commit(room_update_query, (room_id,))
    _send_room_update_to_redis(redis_db, room_id)

    insert_reached_clue_query = f"""
        INSERT INTO {JeopartyDb.SCHEMA}.{JeopartyDb.REACHED_CLUE} (clue_id, room_id) VALUES (%s, %s);
    """
    db.execute_and_commit(insert_reached_clue_query, (clue_id, room_id))


def get_next_clue_id(db, room_id, source_game_id, round_type):
    next_clue_query = f"""
        SELECT clue.id
        FROM {JeopartyDb.SCHEMA}.{JeopartyDb.CLUE} as clue JOIN {JeopartyDb.SCHEMA}.{JeopartyDb.CATEGORY} as category
        ON clue.category_id = category.id
        WHERE 
            clue.id NOT IN (
                select clue_id from {JeopartyDb.SCHEMA}.{JeopartyDb.REACHED_CLUE} WHERE room_id = %s
            )
            AND clue.source_game_id = %s
            AND category.round_type = %s
        ORDER BY category.col_order_index, clue.money
        LIMIT 1;
    """
    next_clue_row = db.execute_and_fetch(
        next_clue_query,
        (room_id, source_game_id, round_type),
        do_fetch_one=True,
    )
    next_clue_id = next_clue_row["id"] if next_clue_row is not None else None
    return next_clue_id


def get_did_all_players_submit(db, room_id, clue_id, check_grading=False):
    grading_clause = " AND graded_as IS NOT NULL" if check_grading else ""
    submission_query = f"""
        SELECT user_id FROM {JeopartyDb.SCHEMA}.{JeopartyDb.SUBMISSION}
        WHERE room_id = %s AND clue_id = %s {grading_clause};
    """
    submission_rows = db.execute_and_fetch(submission_query, (room_id, clue_id))
    submitted_player_ids = set(row["user_id"] for row in submission_rows)

    player_query = f"""
        SELECT id FROM {JeopartyDb.SCHEMA}.{JeopartyDb.USER} WHERE room_id = %s AND is_host = false;
    """
    player_rows = db.execute_and_fetch(player_query, (room_id,))
    all_player_ids = set(row["id"] for row in player_rows)

    return submitted_player_ids == all_player_ids


def wait_for_game_to_be_started(db, room_id):
    has_game_been_started = False
    game_start_timeout = False
    start_time = time.time()
    while not has_game_been_started and not game_start_timeout:
        has_game_been_started_query = f"""
            SELECT 1 FROM {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM} WHERE id = %s AND has_game_been_started = true;
        """
        has_game_been_started = db.execute_and_fetch(
            has_game_been_started_query,
            (room_id,),
            do_fetch_one=True,
        )
        game_start_timeout = time.time() - start_time > GAME_START_TIME_LIMIT
        time.sleep(WHILE_LOOP_SLEEP)


def wait_for_players_to_submit(db, room_id, clue_id, redis_db):
    all_players_submitted = False
    response_timeout = False
    start_time = time.time()
    while not all_players_submitted and not response_timeout:
        all_players_submitted = get_did_all_players_submit(db, room_id, clue_id)
        current_time = time.time()
        response_timeout = current_time - start_time > RESPONSE_TIME_LIMIT

        _send_timer_update_to_redis(
            redis_db, room_id, start_time, current_time, RESPONSE_TIME_LIMIT
        )

        time.sleep(WHILE_LOOP_SLEEP)


def wait_for_players_to_grade(db, room_id, clue_id, redis_db):
    all_players_submitted = False
    response_timeout = False
    start_time = time.time()
    while not all_players_submitted and not response_timeout:
        all_players_submitted = get_did_all_players_submit(
            db, room_id, clue_id, check_grading=True
        )
        current_time = time.time()
        response_timeout = current_time - start_time > GRADING_TIME_LIMIT

        _send_timer_update_to_redis(
            redis_db, room_id, start_time, current_time, GRADING_TIME_LIMIT
        )

        time.sleep(WHILE_LOOP_SLEEP)


def _send_room_update_to_redis(redis_db, room_id):
    room_update_msg = json.dumps({"TYPE": "ROOM_UPDATE"})
    redis_db.publish_to_room(room_id, room_update_msg)


def _send_timer_update_to_redis(
        redis_db, room_id, start_time, current_time, total_time
):
    timer_update_msg = json.dumps(
        {
            "TYPE": "TIMER_UPDATE",
            "TIMER_INFO": {
                "START_TIME": start_time,
                "CURRENT_TIME": current_time,
                "TOTAL_TIME": total_time,
            },
        }
    )
    redis_db.publish_to_room(room_id, timer_update_msg)
