from flask import Flask, g, request, Response
import string
import random
from datetime import datetime

from db import JeopartyDb


app = Flask(__name__)


#####
## Routes
#####


@app.route("/")
def index():
    return "TODO: put the build/ directory's index.html here"


@app.route("/get-current-player")
def get_current_player():
    db = get_db()
    client_id = get_client_id_from_cookie(request)
    player = db.get_player_by_client_id(client_id)
    return {"player": player}


@app.route("/get-current-room")
def get_current_room():
    db = get_db()
    client_id = get_client_id_from_cookie(request)
    player = db.get_player_by_client_id(client_id)

    # Get the Room associated with that Player (if there is such a Room).
    room_row = None
    if player["room_id"] is not None:
        room_query = f"SELECT * FROM {JeopartyDb.ROOM} WHERE id = ?;"
        room_id = player["room_id"]
        room_row = db.execute_and_fetch(room_query, (room_id,), do_fetch_one=True)

    # Send back the Room.
    room = dict(room_row) if room_row is not None else None
    return {"room": room}


@app.route("/create-room", methods=["POST"])
def create_room():
    ## TODO: get all the possible j-archive games (by their id, I guess)
    all_jarchive_ids = [str(random.random())]

    ## TODO: based on the user's criteria, select one (start with fully random, maybe
    ##      filter to last 10 years for now)
    jarchive_id = random.choice(all_jarchive_ids)
    load_db_for_source_game(jarchive_id)

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

    # Update the current Player to be in the new Room.
    client_id = get_client_id_from_cookie(request)
    player_update_query = (
        f"UPDATE {JeopartyDb.PLAYER} SET room_id = ? WHERE client_id = ?;"
    )
    db.execute_and_commit(player_update_query, (room_id, client_id))

    return {"success": True}


@app.route("/join-room", methods=["POST"])
def join_room():
    # Check if there is a matching Room in the db.
    db = get_db()
    room_query = f"SELECT id FROM {JeopartyDb.ROOM} WHERE room_code = ?"
    room_code = request.json["roomCode"]
    room_row = db.execute_and_fetch(room_query, (room_code,), do_fetch_one=True)

    # If the Room exists, have the current player join it.
    # Otherwise, return an error response.
    if room_row is not None:
        player_update_query = f"""
            UPDATE {JeopartyDb.PLAYER} SET room_id = ? WHERE client_id = ?;
        """
        room_id = room_row["id"]
        client_id = get_client_id_from_cookie(request)
        db.execute_and_commit(player_update_query, (room_id, client_id))
        return {"success": True}
    else:
        return {"success": False, "reason": f"Room {room_code} does not exist."}


@app.route("/leave-room", methods=["POST"])
def leave_room():
    player_update_query = f"""
        UPDATE {JeopartyDb.PLAYER} SET room_id = ? WHERE client_id = ?;
    """
    # Set the current Player as having no Room.
    db = get_db()
    client_id = get_client_id_from_cookie(request)
    db.execute_and_commit(player_update_query, (None, client_id))

    return {"success": True}


#####
## App Lifecycle
#####


@app.before_first_request
def setup():
    JeopartyDb.clear_all()
    db = get_db()
    db.create_tables()


@app.teardown_appcontext
def teardown(exception):
    db = get_db()
    db.close()


#####
## Misc Helpers
#####


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = JeopartyDb()
    return db


def get_client_id_from_cookie(req):
    # Get the id we store in the browser's cookies to remember the Player across page
    # refreshes.

    # This magic string should match what is being set in the frontend app's code.
    client_id_cookie_key = "jeopartyClientId"

    client_id = req.cookies.get(client_id_cookie_key)

    return client_id


def generate_room_code():
    return "".join(random.choice(string.ascii_lowercase) for _ in range(4))


def load_db_for_source_game(jarchiveId):
    """Fetch game info, category info, and clue info for a given Jeopardy game on
    j-archive's website, and load our db tables with it all.

    :param str jarchiveId: Identifier of the game in j-archive. Used in the URL in
        j-archive for fetching all the info.
    """
    ## TODO: fetch ish from jarchive
    ## TODO: insert into db (source game, category, clue)
    db = get_db()
    db.execute_and_commit(
        f"INSERT INTO {JeopartyDb.SOURCE_GAME} (date, jarchive_id) VALUES (?, ?)",
        (datetime.now(), jarchiveId),
    )
