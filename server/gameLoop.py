import time
import traceback

from db import JeopartyDb


def game_loop():
    db = JeopartyDb()
    while True:
        time.sleep(1)
        try:
            print(db.execute_and_fetch(f"SELECT * FROM {JeopartyDb.ROOM}"))
        except Exception as e:
            print(traceback.format_exc())
