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
    # For the clientId saved as a cookie in someone's browser, find the existing Player
    # in the db.
    db = getDb()
    playerQuery = f"SELECT * FROM {JeopartyDb.PLAYER} WHERE client_id = ?;"
    clientId = getClientIdFromCookie(request)
    playerRow = db.executeAndFetch(playerQuery, (clientId,), doFetchOne=True)

    # If no Player exists yet with that clientId, create a Player with it.
    if playerRow is None:
        playerInsertQuery = f"INSERT INTO {JeopartyDb.PLAYER} (client_id) VALUES (?);"
        db.executeAndCommit(playerInsertQuery, (clientId,))
        playerRow = db.executeAndFetch(playerQuery, (clientId,), doFetchOne=True)

    # Send back the Player that was either found or created.
    player = dict(playerRow)
    return {"player": player}


@app.route("/get-current-room")
def get_current_room():
    # For the clientId saved as a cookie in someone's browser, find the existing Player
    # in the db.
    db = getDb()
    playerQuery = f"SELECT * FROM {JeopartyDb.PLAYER} WHERE client_id = ?;"
    clientId = getClientIdFromCookie(request)
    playerRow = db.executeAndFetch(playerQuery, (clientId,), doFetchOne=True)

    # Get the Room associated with that Player (if there is such a Room).
    roomRow = None
    if playerRow is not None and playerRow["room_id"] is not None:
        roomQuery = f"SELECT * FROM {JeopartyDb.ROOM} WHERE id = ?;"
        roomId = playerRow["room_id"]
        roomRow = db.executeAndFetch(roomQuery, (roomId,), doFetchOne=True)

    # Send back the Room.
    room = dict(roomRow) if roomRow is not None else None
    return {"room": room}


@app.route("/create-room")
def create_room():
    ## TODO: get all the possible j-archive games (by their id, I guess)
    allJarchiveIds = [str(random.random())]

    ## TODO: based on the user's criteria, select one (start with fully random, maybe
    ##      filter to last 10 years for now)
    jarchiveId = random.choice(allJarchiveIds)

    # For the chosen game from j-archive, load 'er up into our db.
    loadDbForSourceGame(jarchiveId)

    # Create a new Room in the db, using the new SourceGame that was just created and a
    # new room code.
    db = getDb()
    roomCode = generateRoomCode()
    sourceGameQuery = f"SELECT id FROM {JeopartyDb.SOURCE_GAME} WHERE jarchive_id = ?;"
    sourceGame = db.executeAndFetch(sourceGameQuery, (jarchiveId,), doFetchOne=True)
    roomInsertQuery = (
        f"INSERT INTO {JeopartyDb.ROOM} (source_game_id, room_code) VALUES (?, ?);"
    )
    roomId = db.executeAndCommit(roomInsertQuery, (sourceGame["id"], roomCode))

    # Update the current Player to be in the new Room.
    clientId = getClientIdFromCookie(request)
    playerUpdateQuery = (
        f"UPDATE {JeopartyDb.PLAYER} SET room_id = ? WHERE client_id = ?;"
    )
    db.executeAndCommit(playerUpdateQuery, (roomId, clientId))

    return {"success": True}


#####
## App Lifecycle
#####


@app.before_first_request
def setup():
    JeopartyDb.clearAll()
    db = getDb()
    db.createTables()


@app.teardown_appcontext
def teardown(exception):
    db = getDb()
    db.close()


#####
## Misc Helpers
#####


def getDb():
    """Get this Flask app's db object which represents a connection to our SQLite db.
        - If such an object already exists, use the existing one.
        - If not, create one (which opens a connection).

    :return JeopartyDb:
    """
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = JeopartyDb()
    return db


def getClientIdFromCookie(req):
    """Get the id we store in the browser's cookies to remember the Player across page
        refreshes.

    :param flask.Request req:

    :return str:
    """
    # This magic string should match what is being set in the frontend app's code.
    clientIdCookieKey = "jeopartyClientId"

    clientId = req.cookies.get(clientIdCookieKey)

    return clientId


def generateRoomCode():
    """Generate a random code for joining a Room.

    :return str: Random 4 letters, lowercase. E.g. "mxyg"
    """
    return "".join(random.choice(string.ascii_lowercase) for _ in range(4))


def loadDbForSourceGame(jarchiveId):
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
