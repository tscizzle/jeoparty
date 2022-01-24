from time import sleep, time
import traceback

from db import JeopartyDb

WHILE_LOOP_SLEEP = .1
RESPONSE_TIME_LIMIT = .2


def game_loop(room_id):
    try:
        db = JeopartyDb()
        wait_for_players_to_join()
        source_game_row = db.execute_and_fetch(
            f"SELECT source_game_id FROM {JeopartyDb.ROOM} WHERE id = ?", (room_id,),
            do_fetch_one=True)
        print(source_game_row['source_game_id'])
        source_game_id = dict(source_game_row)['source_game_id']
        next_clue_exists = True
        while next_clue_exists:
            next_clue_row = get_next_clue_row(db, source_game_id, round_type='single')
            if not next_clue_row:
                next_clue_exists = False
            run_next_clue(next_clue_row, db, room_id)
        print('game over!')

    except Exception:
        print(traceback.format_exc())


def run_next_clue(next_clue_row, db, room_id):
    clue_id = next_clue_row['clue_id']
    money = next_clue_row['money']
    text = next_clue_row['text']
    clue = next_clue_row['clue']
    answer = next_clue_row['answer']
    print(f'DISPLAY THIS: {money} {text} {clue} {answer}')
    wait_for_players_to_answer()
    db.execute_and_commit(
        'INSERT INTO reached_clue (clue_id, room_id, reached_time) '
        'VALUES (?, ?, ?)', (clue_id, room_id, time()))


def get_next_clue_row(db, source_game_id, round_type):
    next_clue_row = db.execute_and_fetch(
        "SELECT clue.id as clue_id, clue.money, category.text, clue.clue, clue.answer "
        "FROM clue JOIN category ON clue.category_id = category.id "
        "WHERE clue.id NOT IN (select clue_id from reached_clue) "
        "AND clue.source_game_id = ? "
        "AND category.round_type = ? "
        "AND category.col_order_index IS NOT null "
        "ORDER BY category.col_order_index, category.text, clue.money "
        "LIMIT 1",
        (source_game_id, round_type,), do_fetch_one=True)
    return next_clue_row


def wait_for_players_to_join():
    everyone_joined = True
    while not everyone_joined:
        sleep(WHILE_LOOP_SLEEP)


def wait_for_players_to_answer():
    all_players_submitted = False
    response_timeout = False
    start_time = time()
    while not all_players_submitted and not response_timeout:
        if time() - start_time > RESPONSE_TIME_LIMIT:
            response_timeout = True
            print('Response time is over!')
        sleep(WHILE_LOOP_SLEEP)
