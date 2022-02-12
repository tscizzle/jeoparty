from flask import Flask, request, Response, render_template
from flask_cors import CORS
import time
import json

from server.miscHelpers import (
    get_db,
    get_redis_db,
    get_executor,
    get_browser_id_from_cookie,
    generate_room_code,
    format_msg_for_server_side_event,
    load_db_for_source_game,
)
from server.db import JeopartyDb
from server.gameLoop import game_loop

## TODO: only use the /build folder in prod. In dev we don't serve the web page, just
##     API calls, since the react dev server serves the web page.
app = Flask(__name__, template_folder="../build/", static_folder="../build/static/")

## TODO: only do this CORS (cross-origin) stuff in dev, not prod (in prod there is no
##      cross-origin needed, since page will be loaded from same origin as these api
##      routes, see `index` route below.)
CORS(app)


#####
## Routes
#####


## TODO: only serve the "/" route in prod. In dev we don't serve the web page, just API
##     calls, since the react dev server serves the web page.
@app.route("/")
def index():
    return render_template("index.html")


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
    room = db.get_room_by_browser_id(browser_id)
    return {"room": room}


@app.route("/get-players")
def get_players():
    db = get_db()

    browser_id = get_browser_id_from_cookie(request)
    room = db.get_room_by_browser_id(browser_id)
    if room:
        room_id = room["id"]
        players_query = f"""
            SELECT * FROM {JeopartyDb.SCHEMA}.{JeopartyDb.USER} WHERE room_id = %s AND is_host != true;
        """
        player_rows = db.execute_and_fetch(players_query, (room_id,))
    else:
        player_rows = []

    players = {player_row["id"]: dict(player_row) for player_row in player_rows}
    return {"players": players}


@app.route("/create-room", methods=["POST"])
def create_room():
    jarchive_id = load_db_for_source_game()

    # Create a new Room in the db, using the new SourceGame that was just created and a
    # new room code.
    db = get_db()
    room_code = generate_room_code()
    source_game_query = (
        f"SELECT id FROM {JeopartyDb.SCHEMA}.{JeopartyDb.SOURCE_GAME} WHERE jarchive_id = %s;"
    )
    source_game_row = db.execute_and_fetch(
        source_game_query, (jarchive_id,), do_fetch_one=True
    )
    print(f"PREETHI: source_game_query:  {source_game_query}")
    print(f"PREETHI: jarchive_id:  {jarchive_id}")

    print(f"PREETHI: source_game_row: {source_game_row}")
    room_insert_query = (
        f"INSERT INTO {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM} (source_game_id, room_code) VALUES (%s, %s) RETURNING ID;"
    )
    room_id = db.execute_and_commit(
        room_insert_query, (source_game_row["id"], room_code)
    )

    print(f"PREETHI: room_insert_query: {room_insert_query}")
    print(
        f'PREETHI: (source_game_row["id"], room_code): {(source_game_row["id"], room_code)}')
    print(f"PREETHI: room_id: {room_id}")
    # Update the current User to be in the new Room.
    browser_id = get_browser_id_from_cookie(request)
    user_update_query = f"""
        UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.USER} SET room_id = %s, is_host = true WHERE browser_id = %s;
    """
    print(f'PREETHI: user_update_query: \n {user_update_query}')
    print(f"PREETHI: (room_id, browser_id): \n {(room_id, browser_id)}")
    db.execute_and_commit(user_update_query, (room_id, browser_id))

    # Start an ongoing loop in the background for progressing the game.
    executor = get_executor(app)
    executor.submit(game_loop, room_id)

    return {"success": True}


@app.route("/join-room", methods=["POST"])
def join_room():
    # Check if there is a matching Room in the db.
    db = get_db()
    room_code = request.json["roomCode"]
    room_query = f"SELECT id FROM {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM} WHERE room_code = %s"
    room_row = db.execute_and_fetch(room_query, (room_code,), do_fetch_one=True)

    # If the Room exists, have the current User join it.
    # Otherwise, send back an error response.
    if room_row is not None:
        browser_id = get_browser_id_from_cookie(request)
        name_to_register = request.json["nameToRegister"]
        canvas_image_blob = request.json["canvasImageBlob"]

        user_update_query = f"""
            UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.USER}
            SET room_id = %s, registered_name = %s, image_blob = %s, is_host = false
            WHERE browser_id = %s;
        """
        room_id = room_row["id"]
        db.execute_and_commit(
            user_update_query,
            (room_id, name_to_register, canvas_image_blob, browser_id),
        )

        # Tell other clients in the Room that a new Player joined.
        redis_db = get_redis_db()
        player_joined_msg = json.dumps({"TYPE": "PLAYERS_UPDATE"})
        redis_db.publish_to_room(room_id, player_joined_msg)

        return {"success": True}
    else:
        return {"success": False, "reason": f"Room {room_code} does not exist."}


@app.route("/leave-room", methods=["POST"])
def leave_room():
    # End the User's subscription to Room updates.

    db = get_db()
    redis_db = get_redis_db()
    browser_id = get_browser_id_from_cookie(request)
    user = db.get_user_by_browser_id(browser_id)
    room = db.get_room_by_browser_id(browser_id)
    user_id = user["id"]
    room_id = room["id"]
    subscription_ending_msg = redis_db.get_room_subscription_ending_msg(user_id)
    redis_db.publish_to_room(room_id, subscription_ending_msg)

    # Set the current User as having no Room.
    user_update_query = f"""
        UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.USER} SET room_id = %s WHERE browser_id = %s;
    """
    db.execute_and_commit(user_update_query, (None, browser_id))

    # Tell other clients in the Room that a Player left.
    redis_db = get_redis_db()
    player_left_msg = json.dumps({"TYPE": "PLAYERS_UPDATE"})
    redis_db.publish_to_room(room_id, player_left_msg)

    return {"success": True}


@app.route("/start-game", methods=["POST"])
def start_game():
    # Set the current Room as having started.
    db = get_db()

    browser_id = get_browser_id_from_cookie(request)
    room = db.get_room_by_browser_id(browser_id)
    room_id = room["id"]

    room_update_query = f"""
        UPDATE {JeopartyDb.SCHEMA}.{JeopartyDb.ROOM} SET has_game_been_started = true WHERE id = %s;
    """
    db.execute_and_commit(room_update_query, (room_id,))

    return {"success": True}


@app.route("/get-submissions")
def get_submissions():
    db = get_db()

    browser_id = get_browser_id_from_cookie(request)
    room = db.get_room_by_browser_id(browser_id)
    room_id = room["id"]

    submission_query = f"""SELECT * FROM {JeopartyDb.SCHEMA}.{JeopartyDb.SUBMISSION} WHERE room_id = %s;"""
    submission_rows = db.execute_and_fetch(submission_query, (room_id,))

    submissions = {
        submission_row["id"]: dict(submission_row) for submission_row in submission_rows
    }
    return {"submissions": submissions}


@app.route("/submit-response", methods=["POST"])
def submit_response():
    # Add the Submission to the db
    db = get_db()
    browser_id = get_browser_id_from_cookie(request)
    user = db.get_user_by_browser_id(browser_id)
    room = db.get_room_by_browser_id(browser_id)
    user_id = user["id"]
    room_id = room["id"]
    clue_id = request.json["clueId"]
    submission_text = request.json.get("submissionText", "")
    is_fake_guess = request.json.get("isFakeGuess", 0)

    submission_insert_query = f"""
        INSERT INTO {JeopartyDb.SCHEMA}.{JeopartyDb.SUBMISSION}
        (user_id, clue_id, room_id, text, is_fake_guess) VALUES (%s, %s, %s, %s, %s);
    """
    db.execute_and_commit(
        submission_insert_query,
        (user_id, clue_id, room_id, submission_text, is_fake_guess),
    )

    # Tell other clients in the same Room that Submissions changed.
    redis_db = get_redis_db()
    submission_update_msg = json.dumps({"TYPE": "SUBMISSION_UPDATE"})
    redis_db.publish_to_room(room_id, submission_update_msg)

    return {"success": True}


@app.route("/grade-response", methods=["POST"])
def grade_response():
    # Set graded_as in the Submission table in the db
    db = get_db()
    browser_id = get_browser_id_from_cookie(request)
    user = db.get_user_by_browser_id(browser_id)
    room = db.get_room_by_browser_id(browser_id)
    user_id = user["id"]
    room_id = room["id"]
    clue_id = request.json["clueId"]
    graded_as = request.json["gradedAs"]

    # This combo insert-update is how SQLite does upserts.
    grade_response_query = f"""
        INSERT INTO {JeopartyDb.SCHEMA}.{JeopartyDb.SUBMISSION}
        (user_id, clue_id, room_id, graded_as) VALUES (%s, %s, %s, %s)
        ON CONFLICT(user_id, clue_id, room_id)
        DO UPDATE SET graded_as = excluded.graded_as;
    """
    db.execute_and_commit(grade_response_query, (user_id, clue_id, room_id, graded_as))

    # Tell other clients in the same Room that Submissions changed.
    redis_db = get_redis_db()
    submission_update_msg = json.dumps({"TYPE": "SUBMISSION_UPDATE"})
    redis_db.publish_to_room(room_id, submission_update_msg)

    return {"success": True}


@app.route("/get-j-game-data")
def get_j_game_data():
    # For a given SourceGame, get all the data (SourceGame, Categories, Clues).

    db = get_db()

    browser_id = get_browser_id_from_cookie(request)
    room = db.get_room_by_browser_id(browser_id)
    source_game_id = room["source_game_id"]

    source_game_query = f"SELECT * FROM {JeopartyDb.SCHEMA}.{JeopartyDb.SOURCE_GAME} WHERE id = %s;"
    category_query = f"SELECT * FROM {JeopartyDb.SCHEMA}.{JeopartyDb.CATEGORY} WHERE source_game_id = %s;"
    clue_query = f"SELECT * FROM {JeopartyDb.SCHEMA}.{JeopartyDb.CLUE} WHERE source_game_id = %s;"
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


@app.route("/subscribe-to-room-updates/<user_id>/<room_id>")
def subscribe_to_room_updates(user_id, room_id):
    # This request sets up a long-running "event-stream" from server to client. While
    # this function is going forever, messages can be put in redis, and they will be
    # grabbed by the redis pubsub below and sent to the client via that event-stream.

    redis_db = get_redis_db()

    # Close other open streams for this same user.
    subscription_ending_msg = redis_db.get_room_subscription_ending_msg(user_id)
    redis_db.publish_to_room(room_id, subscription_ending_msg)
    ## TODO: That makes it so we never have more than 1 ongoing loop per user, but we
    ##      still have the issue that that 1 loop continues even after the user leaves
    ##      (until it hits the super long time limit). So we've bounded the issue a
    ##      couple ways, but the best would be if the loop ended right when the user
    ##      disconnected.

    # Subscribe to updates about the Room.
    room_pubsub = redis_db.subscribe_to_room(room_id)

    def msg_stream():
        start_time = time.time()
        time_limit = 60 * 60 * 10
        while time.time() - start_time < time_limit:
            msg_dict = room_pubsub.get_message()
            if msg_dict and msg_dict["type"] == "message":
                msg_bytes = msg_dict["data"]
                msg_str = msg_bytes.decode()

                # Allow the stream to be ended by a special message.
                if msg_str == redis_db.get_room_subscription_ending_msg(user_id):
                    break

                # If it's a regular message, forward it to the client.
                server_side_event_msg = format_msg_for_server_side_event(msg_str)
                yield server_side_event_msg

            time.sleep(0.01)

    return Response(msg_stream(), mimetype="text/event-stream")


@app.route("/end-subscription-to-room-updates", methods=["POST"])
def end_subscription_to_room_updates():
    db = get_db()

    browser_id = get_browser_id_from_cookie(request)
    room = db.get_room_by_browser_id(browser_id)
    if room:
        user = db.get_user_by_browser_id(browser_id)
        user_id = user["id"]
        room_id = room["id"]

        redis_db = get_redis_db()
        subscription_ending_msg = redis_db.get_room_subscription_ending_msg(user_id)
        redis_db.publish_to_room(room_id, subscription_ending_msg)

    return {"success": True}


#####
## App Lifecycle
#####


@app.before_first_request
def setup():
    # DB stuff
    JeopartyDb().clear_all()
    db = get_db()
    db.create_tables()
