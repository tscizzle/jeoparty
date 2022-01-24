from time import sleep
import traceback

from db import JeopartyDb

WHILE_LOOP_SLEEP = .1


def game_loop(room_id):
    try:
        db = JeopartyDb()
        wait_for_players()
        source_game_row = db.execute_and_fetch(
            f"SELECT source_game_id FROM {JeopartyDb.ROOM} WHERE id = ?", (room_id,),
            do_fetch_one=True)
        print(source_game_row['source_game_id'])
        source_game_id = dict(source_game_row)['source_game_id']
        ordered_clue_rows = db.execute_and_fetch(
            "SELECT clue.money, category.col_order_index, category.text, clue.clue, clue.answer "
            "FROM clue JOIN category ON clue.category_id = category.id "
            "WHERE clue.id NOT IN (select clue_id from reached_clue) "
            "AND clue.source_game_id = ? "
            "AND category.col_order_index IS NOT null "
            "ORDER BY category.col_order_index, category.text, clue.money "
            "LIMIT 1",
            (source_game_id,))
        for clue_row in ordered_clue_rows:
            money = clue_row['money']
            col_order_index = clue_row['col_order_index']
            text = clue_row['text']
            clue = clue_row['clue']
            answer = clue_row['answer']
            print(f'{money} {col_order_index} {text} {clue} {answer}')

    except Exception:
        print(traceback.format_exc())


def wait_for_players():
    everyone_joined = True
    while not everyone_joined:
        sleep(WHILE_LOOP_SLEEP)
