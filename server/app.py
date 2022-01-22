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
    # For the client_id saved as a cookie in someone's browser, find the existing Player
    # in the db.
    db = get_db()
    player_query = f"SELECT * FROM {JeopartyDb.PLAYER} WHERE client_id = ?;"
    client_id = get_client_id_from_cookie(request)
    player_row = db.executeAndFetch(player_query, (client_id,), doFetchOne=True)

    # If no Player exists yet with that client_id, create a Player with it.
    if player_row is None:
        player_insert_query = f"INSERT INTO {JeopartyDb.PLAYER} (client_id) VALUES (?);"
        db.executeAndCommit(player_insert_query, (client_id,))
        player_row = db.executeAndFetch(player_query, (client_id,), doFetchOne=True)

    # Send back the Player that was either found or created.
    player = dict(player_row)
    return {"player": player}


@app.route("/get-current-room")
def get_current_room():
    # For the client_id saved as a cookie in someone's browser, find the existing Player
    # in the db.
    db = get_db()
    player_query = f"SELECT * FROM {JeopartyDb.PLAYER} WHERE client_id = ?;"
    client_id = get_client_id_from_cookie(request)
    player_row = db.executeAndFetch(player_query, (client_id,), doFetchOne=True)

    # Get the Room associated with that Player (if there is such a Room).
    room_row = None
    if player_row is not None and player_row["room_id"] is not None:
        room_query = f"SELECT * FROM {JeopartyDb.ROOM} WHERE id = ?;"
        room_id = player_row["room_id"]
        room_row = db.executeAndFetch(room_query, (room_id,), doFetchOne=True)

    # Send back the Room.
    room = dict(room_row) if room_row is not None else None
    return {"room": room}


@app.route("/create-room")
def create_room():
    ## TODO: get all the possible j-archive games (by their id, I guess)
    all_jarchive_ids = [str(random.random())]

    ## TODO: based on the user's criteria, select one (start with fully random, maybe
    ##      filter to last 10 years for now)
    jarchive_id = random.choice(all_jarchive_ids)

    # For the chosen game from j-archive, load 'er up into our db.
    load_db_for_source_game(jarchive_id)

    # Create a new Room in the db, using the new SourceGame that was just created and a
    # new room code.
    db = get_db()
    room_code = generate_room_code()
    source_game_query = f"SELECT id FROM {JeopartyDb.SOURCE_GAME} WHERE jarchive_id = ?;"
    source_game = db.executeAndFetch(source_game_query, (jarchive_id,), doFetchOne=True)
    room_insert_query = (
        f"INSERT INTO {JeopartyDb.ROOM} (source_game_id, room_code) VALUES (?, ?);"
    )
    room_id = db.executeAndCommit(room_insert_query, (source_game["id"], room_code))

    # Update the current Player to be in the new Room.
    client_id = get_client_id_from_cookie(request)
    player_update_query = (
        f"UPDATE {JeopartyDb.PLAYER} SET room_id = ? WHERE client_id = ?;"
    )
    db.executeAndCommit(player_update_query, (room_id, client_id))

    return {"success": True}


#####
## App Lifecycle
#####


@app.before_first_request
def setup():
    JeopartyDb.clearAll()
    db = get_db()
    db.createTables()


@app.teardown_appcontext
def teardown(exception):
    db = get_db()
    db.close()


#####
## Misc Helperscd
#####


def get_db():
    """Get this Flask app's db object which represents a connection to our SQLite db.
        - If such an object already exists, use the existing one.
        - If not, create one (which opens a connection).

    :return JeopartyDb:
    """
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = JeopartyDb()
    return db


def get_client_id_from_cookie(req):
    """Get the id we store in the browser's cookies to remember the Player across page
        refreshes.

    :param flask.Request req:

    :return str:
    """
    # This magic string should match what is being set in the frontend app's code.
    client_id_cookie_key = "jeopartyClientId"

    client_id = req.cookies.get(client_id_cookie_key)

    return client_id


def generate_room_code():
    """Generate a random code for joining a Room.

    :return str: Random 4 letters, lowercase. E.g. "mxyg"
    """
    return "".join(random.choice(string.ascii_lowercase) for _ in range(4))


def load_db_for_source_game(jarchiveId):
    """Fetch game info, category info, and clue info for a given Jeopardy game on
    j-archive's website, and load our db tables with it all.

    :param str jarchiveId: Identifier of the game in j-archive. Used in the URL in
        j-archive for fetching all the info.
    """
    ## TODO: fetch ish from jarchive
    ## TODO: insert into db (source game, category, clue)
    db = getDb()
    db.executeAndCommit(
        f"INSERT INTO {JeopartyDb.SOURCE_GAME} (date, jarchive_id) VALUES (?, ?)",
        (datetime.now(), jarchiveId),
    )
