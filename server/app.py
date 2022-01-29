from flask import Flask, request, Response
from flask_cors import CORS
import time

from miscHelpers import (
    get_db,
    get_redis_db,
    get_executor,
    get_browser_id_from_cookie,
    get_room_subscription_key,
    generate_room_code,
    format_msg_for_server_side_event,
    load_db_for_source_game,
)
from db import JeopartyDb
from gameLoop import game_loop

app = Flask(__name__)

## TODO: only do this CORS (cross-origin) stuff in dev, not prod (in prod there is no
##      cross-origin needed, since page will be loaded from same origin as these api
##      routes, see `index` route below.)
CORS(app)


#####
## Routes
#####


@app.route("/")
def index():
    return "TODO: put the build/ directory's index.html here"


@app.route("/get-current-user")
def get_current_user():
    db = get_db()
    browser_id = get_browser_id_from_cookie(request)
    user = db.get_user_by_browser_id(browser_id)
    return {"user": user}


@app.route("/get-current-room")
def get_current_room():
    db = get_db()
    browser_id = get_browser_id_from_cookie(request)
    user = db.get_user_by_browser_id(browser_id)

    # Get the Room associated with that User (if there is such a Room).
    room_row = None
    if user["room_id"] is not None:
        room_query = f"SELECT * FROM {JeopartyDb.ROOM} WHERE id = ?;"
        room_id = user["room_id"]
        room_row = db.execute_and_fetch(room_query, (room_id,), do_fetch_one=True)

    # Send back the Room.
    room = dict(room_row) if room_row is not None else None
    return {"room": room}


@app.route("/create-room", methods=["POST"])
def create_room():
    jarchive_id = load_db_for_source_game()

    # Create a new Room in the db, using the new SourceGame that was just created and a
    # new room code.
    db = get_db()
    room_code = generate_room_code()
    source_game_query = (
        f"SELECT id FROM {JeopartyDb.SOURCE_GAME} WHERE jarchive_id = ?;"
    )
    source_game_row = db.execute_and_fetch(
        source_game_query, (jarchive_id,), do_fetch_one=True
    )
    room_insert_query = (
        f"INSERT INTO {JeopartyDb.ROOM} (source_game_id, room_code) VALUES (?, ?);"
    )
    room_id = db.execute_and_commit(
        room_insert_query, (source_game_row["id"], room_code)
    )

    # Update the current User to be in the new Room.
    browser_id = get_browser_id_from_cookie(request)
    user_update_query = f"""
        UPDATE {JeopartyDb.USER} SET room_id = ?, is_host = true WHERE browser_id = ?;
    """
    db.execute_and_commit(user_update_query, (room_id, browser_id))

    # Start an ongoing loop in the background for progressing the game.
    executor = get_executor(app)
    executor.submit(game_loop, room_id)

    return {"success": True}


@app.route("/join-room", methods=["POST"])
def join_room():
    # Check if there is a matching Room in the db.
    db = get_db()
    room_query = f"SELECT id FROM {JeopartyDb.ROOM} WHERE room_code = ?"
    room_code = request.json["roomCode"]
    room_row = db.execute_and_fetch(room_query, (room_code,), do_fetch_one=True)

    # If the Room exists, have the current User join it.
    # Otherwise, send back an error response.
    if room_row is not None:
        user_update_query = f"""
            UPDATE {JeopartyDb.USER} SET room_id = ?, is_host = false
                WHERE browser_id = ?;
        """
        room_id = room_row["id"]
        browser_id = get_browser_id_from_cookie(request)
        db.execute_and_commit(user_update_query, (room_id, browser_id))
        return {"success": True}
    else:
        return {"success": False, "reason": f"Room {room_code} does not exist."}


@app.route("/submit-response", methods=["POST"])
def submit_response():
    # Add the submission to the db
    db = get_db()
    browser_id = get_browser_id_from_cookie(request)
    user_id = db.get_user_by_browser_id(browser_id)
    clue_id = request.json["clueID"]
    room_id = request.json["roomID"]
    submission_text = request.json["submissionText"]
    is_fake_guess = request.json["isFakeGuess"]

    submission_insert_query = (
        f"INSERT INTO {JeopartyDb.SUBMISSION} (user_id, clue_id, room_id, text, "
        f"is_fake_guess) VALUES (?, ?);"
    )
    db.execute_and_commit(
        submission_insert_query,
        (user_id, clue_id, room_id, submission_text, is_fake_guess)
    )
    return {"success": True}


@app.route("/grade-response", methods=["POST"])
def grade_response():
    # Set is_correct in the Submission table in the db
    db = get_db()
    browser_id = get_browser_id_from_cookie(request)
    user_id = db.get_user_by_browser_id(browser_id)
    clue_id = request.json["clueID"]
    room_id = request.json["roomID"]
    is_correct = request.json["isCorrect"]

    grade_response_query = f"""
                UPDATE {JeopartyDb.SUBMISSION} SET is_correct = ? 
                WHERE user_id = ? AND clue_id = ? AND room_id = ?;
            """
    db.execute_and_commit(grade_response_query, (is_correct, user_id, clue_id, room_id))
    return {"success": True}


@app.route("/leave-room", methods=["POST"])
def leave_room():
    # Set the current User as having no Room.
    db = get_db()
    user_update_query = f"""
        UPDATE {JeopartyDb.USER} SET room_id = ? WHERE browser_id = ?;
    """
    browser_id = get_browser_id_from_cookie(request)
    db.execute_and_commit(user_update_query, (None, browser_id))

    return {"success": True}


@app.route("/get-j-game-data")
def get_j_game_data():
    # For a given SourceGame, get all the data (SourceGame, Categories, Clues).
    db = get_db()
    source_game_id = request.args.get("sourceGameId")
    source_game_query = f"SELECT * FROM {JeopartyDb.SOURCE_GAME} WHERE id = ?;"
    category_query = f"SELECT * FROM {JeopartyDb.CATEGORY} WHERE source_game_id = ?;"
    clue_query = f"SELECT * FROM {JeopartyDb.CLUE} WHERE source_game_id = ?;"
    source_game_row = db.execute_and_fetch(
        source_game_query, (source_game_id,), do_fetch_one=True
    )
    category_rows = db.execute_and_fetch(category_query, (source_game_id,))
    clue_rows = db.execute_and_fetch(clue_query, (source_game_id,))

    # Send back all the data.
    source_game = dict(source_game_row) if source_game_row is not None else None
    categories = {
        category_row["id"]: dict(category_row) for category_row in category_rows
    }
    clues = {clue_row["id"]: dict(clue_row) for clue_row in clue_rows}
    return {"sourceGame": source_game, "categories": categories, "clues": clues}


@app.route("/subscribe-to-room-updates")
def subscribe_to_room_updates():
    # This request sets up a long-running "event-stream" from server to client. While
    # this function is going forever, messages can be put in redis, and they will be
    # grabbed by the redis pubsub below and sent to the client via that event-stream.

    redis_db = get_redis_db()
    room_id = request.args.get("roomId")
    room_pubsub = redis_db.pubsub()
    sub_key = get_room_subscription_key(room_id)
    room_pubsub.subscribe(sub_key)

    def msg_stream():
        while True:
            msg_dict = room_pubsub.get_message()
            if msg_dict and msg_dict["type"] == "message":
                msg_bytes = msg_dict["data"]
                msg_str = msg_bytes.decode()
                server_side_event_msg = format_msg_for_server_side_event(msg_str)
                yield server_side_event_msg
            time.sleep(0.001)

    return Response(msg_stream(), mimetype="text/event-stream")


#####
## App Lifecycle
#####


@app.before_first_request
def setup():
    # DB stuff
    JeopartyDb.clear_all()
    db = get_db()
    db.create_tables()
