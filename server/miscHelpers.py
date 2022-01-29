from flask import g
from flask_executor import Executor
import redis
import string
import random

from db import JeopartyDb


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = JeopartyDb()
    return db


def get_redis_db():
    redis_db = getattr(g, "_redis_db", None)
    if redis_db is None:
        redis_db = g._redis_db = redis.Redis()
    return redis_db


def get_executor(app):
    executor = getattr(g, "_executor", None)
    if executor is None:
        executor = g._executor = Executor(app)
    return executor


def get_browser_id_from_cookie(req):
    # Get the id we store in the browser's cookies to remember the User across page
    # refreshes.

    # This magic string should match what is being set in the frontend app's code.
    browser_id_cookie_key = "jPartyBrowserId"

    browser_id = req.cookies.get(browser_id_cookie_key)

    return browser_id


def get_room_subscription_key(room_id):
    return f"room-{room_id}"


def generate_room_code():
    return "".join(random.choice(string.ascii_uppercase) for _ in range(4))


def format_msg_for_server_side_event(msg):
    # https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
    return f"data:{msg}\n\n"


def load_db_for_source_game():
    from jarchiveParser import JarchiveParser

    random_game_info = JarchiveParser().parse()
    jarchive_id = random_game_info["episode_details"]["jarchive_id"]
    taped_date = random_game_info["episode_details"]["taped"]
    db = get_db()
    source_game_id = db.execute_and_commit(
        f"INSERT INTO {JeopartyDb.SOURCE_GAME} (taped_date, jarchive_id) VALUES (?, ?)",
        (taped_date, jarchive_id),
    )
    inserted_categories = []
    for clue_details in random_game_info["clues"]:
        category_text = clue_details["category_info"]["text"]
        if category_text not in inserted_categories:
            category_id = db.execute_and_commit(
                f"INSERT INTO {JeopartyDb.CATEGORY} "
                f"(source_game_id, col_order_index, text, round_type) VALUES (?, ?, ?, ?)",
                (
                    source_game_id,
                    clue_details["category_info"]["col_order_index"],
                    category_text,
                    clue_details["category_info"]["round_type"],
                ),
            )
            inserted_categories.append(category_text)

        category_query = f"SELECT id FROM {JeopartyDb.CATEGORY} WHERE text = ?"
        category_row = db.execute_and_fetch(
            category_query, (category_text,), do_fetch_one=True
        )
        category_id = dict(category_row)["id"]

        db.execute_and_commit(
            f"INSERT INTO {JeopartyDb.CLUE} "
            f"(category_id, source_game_id, clue, answer, money) VALUES (?, ?, ?, ?, ?)",
            (
                category_id,
                source_game_id,
                clue_details["question_and_answer"]["clue"],
                clue_details["question_and_answer"]["answer"],
                clue_details["money"],
            ),
        )
    return jarchive_id