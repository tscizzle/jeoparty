import redis
import json
import time
import traceback

from miscHelpers import get_room_subscription_key
from db import JeopartyDb

WHILE_LOOP_SLEEP = 1
RESPONSE_TIME_LIMIT = 60
GRADING_TIME_LIMIT = 20


#####
## Main loop
#####


def game_loop(room_id):
    try:

        db = JeopartyDb()

        redis_db = redis.Redis()
        room_sub_key = get_room_subscription_key(room_id)

        wait_for_game_to_be_started(db, room_id)
        _send_room_update_to_redis(redis_db, room_sub_key)

        source_game_query = f"""
            SELECT source_game_id FROM {JeopartyDb.ROOM} WHERE id = ?;
        """
        source_game_row = db.execute_and_fetch(
            source_game_query,
            (room_id,),
            do_fetch_one=True,
        )
        source_game_id = dict(source_game_row)["source_game_id"]

        for round_type in ["single", "double", "final"]:
            while next_clue_id := get_next_clue_id(
                db, room_id, source_game_id, round_type=round_type
            ):
                run_next_clue(next_clue_id, db, room_id, redis_db, room_sub_key)
        _send_room_update_to_redis(redis_db, room_sub_key)

    except Exception:
        print(traceback.format_exc())


#####
## Helpers
#####


def run_next_clue(clue_id, db, room_id, redis_db, room_sub_key):
    room_update_query = f"""
        UPDATE {JeopartyDb.ROOM}
        SET current_clue_id = ?, current_clue_stage = 'answering'
        WHERE id = ?;
    """
    db.execute_and_commit(room_update_query, (clue_id, room_id))

    wait_for_players_to_submit(db, room_id, clue_id, redis_db, room_sub_key)

    room_update_query = f"""
        UPDATE {JeopartyDb.ROOM} SET current_clue_stage = 'grading' WHERE id = ?;
    """
    db.execute_and_commit(room_update_query, (room_id,))
    wait_for_players_to_grade(db, room_id, clue_id, redis_db, room_sub_key)

    room_update_query = f"""
        UPDATE {JeopartyDb.ROOM} SET current_clue_stage = NULL WHERE id = ?;
    """
    db.execute_and_commit(room_update_query, (room_id,))

    insert_reached_clue_query = f"""
        INSERT INTO {JeopartyDb.REACHED_CLUE} (clue_id, room_id) VALUES (?, ?);
    """
    db.execute_and_commit(insert_reached_clue_query, (clue_id, room_id))


def get_next_clue_id(db, room_id, source_game_id, round_type):
    next_clue_query = f"""
        SELECT clue.id
        FROM {JeopartyDb.CLUE} as clue JOIN {JeopartyDb.CATEGORY} as category
        ON clue.category_id = category.id
        WHERE 
            clue.id NOT IN (
                select clue_id from {JeopartyDb.REACHED_CLUE} WHERE room_id = ?
            )
            AND clue.source_game_id = ?
            AND category.round_type = ?
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


def wait_for_game_to_be_started(db, room_id):
    has_game_been_started_query = f"""
        SELECT 1 FROM {JeopartyDb.ROOM} WHERE id = ? AND has_game_been_started = 1;
    """
    while True:
        has_game_been_started = db.execute_and_fetch(
            has_game_been_started_query,
            (room_id,),
            do_fetch_one=True,
        )
        if has_game_been_started:
            break
        time.sleep(WHILE_LOOP_SLEEP)


def get_did_all_players_submit(db, room_id, clue_id, check_grading=False):
    grading_clause = " AND is_correct IS NOT NULL" if check_grading else ""
    submission_query = f"""
        SELECT user_id FROM {JeopartyDb.SUBMISSION}
        WHERE room_id = ? AND clue_id = ? {grading_clause};
    """
    submission_rows = db.execute_and_fetch(submission_query, (room_id, clue_id))
    submitted_player_ids = set(row["user_id"] for row in submission_rows)

    player_query = f"""
        SELECT id FROM {JeopartyDb.USER} WHERE room_id = ? AND is_host != 0;
    """
    player_rows = db.execute_and_fetch(player_query, (room_id,))
    all_player_ids = set(row["id"] for row in player_rows)

    return submitted_player_ids == all_player_ids


def wait_for_players_to_submit(db, room_id, clue_id, redis_db, room_sub_key):
    _send_room_update_to_redis(redis_db, room_sub_key)
    all_players_submitted = False
    response_timeout = False
    start_time = time.time()
    while not all_players_submitted and not response_timeout:
        all_players_submitted = get_did_all_players_submit(db, room_id, clue_id)
        response_timeout = time.time() - start_time > RESPONSE_TIME_LIMIT
        time.sleep(WHILE_LOOP_SLEEP)
    _send_room_update_to_redis(redis_db, room_sub_key)


def wait_for_players_to_grade(db, room_id, clue_id, redis_db, room_sub_key):
    _send_room_update_to_redis(redis_db, room_sub_key)
    all_players_submitted = False
    response_timeout = False
    start_time = time.time()
    while not all_players_submitted and not response_timeout:
        all_players_submitted = get_did_all_players_submit(
            db, room_id, clue_id, check_grading=True
        )
        response_timeout = time.time() - start_time > GRADING_TIME_LIMIT
        time.sleep(WHILE_LOOP_SLEEP)
    _send_room_update_to_redis(redis_db, room_sub_key)


def _send_room_update_to_redis(redis_db, room_sub_key):
    redis_db.publish(room_sub_key, json.dumps({"TYPE": "ROOM_UPDATE"}))
