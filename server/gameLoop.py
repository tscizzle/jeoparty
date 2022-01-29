import redis
import json
import time
import traceback

from miscHelpers import get_room_subscription_key
from db import JeopartyDb

WHILE_LOOP_SLEEP = 1
RESPONSE_TIME_LIMIT = 0.2


def game_loop(room_id):
    try:

        db = JeopartyDb()

        redis_db = redis.Redis()
        room_sub_key = get_room_subscription_key(room_id)

        wait_for_game_to_be_started(db, room_id)

        game_started_msg = json.dumps({"TYPE": "GAME_STARTED"})
        redis_db.publish(room_sub_key, game_started_msg)

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
            while next_clue_row := get_next_clue_row(
                    db, room_id, source_game_id, round_type=round_type
            ):
                run_next_clue(next_clue_row, db, room_id, redis_db, room_sub_key)

        game_over_msg = json.dumps({"TYPE": "GAME_OVER"})
        redis_db.publish(room_sub_key, game_over_msg)

    except Exception:
        print(traceback.format_exc())


def run_next_clue(next_clue_row, db, room_id, redis_db, room_sub_key):
    clue_id = next_clue_row["id"]
    money = next_clue_row["money"]
    clue = next_clue_row["clue"]
    answer = next_clue_row["answer"]
    print(f"DISPLAY THIS: {money} {clue} {answer}")
    redis_db.publish(room_sub_key, {"TYPE": "CLUE_STARTED", "clue_id": clue_id})
    wait_for_players_to_submit(db, room_id, clue_id)
    redis_db.publish(room_sub_key, {"TYPE": "CLUE_ENDED", "clue_id": clue_id})

    insert_reached_clue_query = f"""
        INSERT INTO {JeopartyDb.REACHED_CLUE} (clue_id, room_id) VALUES (?, ?);
    """
    db.execute_and_commit(insert_reached_clue_query, (clue_id, room_id))


def get_next_clue_row(db, room_id, source_game_id, round_type):
    next_clue_query = f"""
        SELECT clue.id, clue.money, clue.clue, clue.answer
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
    return next_clue_row


def wait_for_game_to_be_started(db, room_id):
    has_game_been_started_query = f"""
        SELECT 1 FROM {JeopartyDb.ROOM} WHERE room_id = ? AND has_game_been_started = 1;
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


def get_did_all_players_submit(db, room_id, clue_id):
    submission_query = f"""
        SELECT user_id FROM {JeopartyDb.SUBMISSION} WHERE room_id = ? AND clue_id = ?;
    """
    submission_rows = db.execute_and_fetch(submission_query, (room_id, clue_id))
    submitted_player_ids = set(row["user_id"] for row in submission_rows)

    player_query = f"""
        SELECT id FROM {JeopartyDb.USER} WHERE room_id = ? AND is_host != 0;
    """
    player_rows = db.execute_and_fetch(player_query, (room_id,))
    all_player_ids = set(row["id"] for row in player_rows)

    return submitted_player_ids == all_player_ids


def wait_for_players_to_submit(db, room_id, clue_id):
    all_players_submitted = False
    response_timeout = False
    start_time = time.time()
    while not all_players_submitted and not response_timeout:
        all_players_submitted = get_did_all_players_submit(db, room_id, clue_id)
        response_timeout = time.time() - start_time > RESPONSE_TIME_LIMIT

        time.sleep(WHILE_LOOP_SLEEP)
