from time import sleep, time
import traceback

from db import JeopartyDb

WHILE_LOOP_SLEEP = .1
RESPONSE_TIME_LIMIT = 1


def game_loop(room_id):
    try:
        db = JeopartyDb()
        wait_for_players_to_join()
        source_game_row = db.execute_and_fetch(
            f"SELECT source_game_id FROM {JeopartyDb.ROOM} WHERE id = ?", (room_id,),
            do_fetch_one=True)
        print(source_game_row['source_game_id'])
        source_game_id = dict(source_game_row)['source_game_id']
        next_clue_row = db.execute_and_fetch(
            "SELECT clue.money, category.text, clue.clue, clue.answer "
            "FROM clue JOIN category ON clue.category_id = category.id "
            "WHERE clue.id NOT IN (select clue_id from reached_clue) "
            "AND clue.source_game_id = ? "
            "AND category.col_order_index IS NOT null "
            "ORDER BY category.col_order_index, category.text, clue.money "
            "LIMIT 1",
            (source_game_id,))
        money = next_clue_row['money']
        text = next_clue_row['text']
        clue = next_clue_row['clue']
        answer = next_clue_row['answer']
        print(f'DISPLAY THIS: {money} {text} {clue} {answer}')
        wait_for_players_to_answer()


    except Exception:
        print(traceback.format_exc())


def wait_for_players_to_join():
    everyone_joined = True
    while not everyone_joined:
        sleep(WHILE_LOOP_SLEEP)


def wait_for_players_to_answer():
    all_players_submitted = False
    response_timeout = False
    start_time = time()
    while not all_players_submitted or not response_timeout:
        if time() - start_time > RESPONSE_TIME_LIMIT:
            response_timeout = True
        sleep(WHILE_LOOP_SLEEP)
