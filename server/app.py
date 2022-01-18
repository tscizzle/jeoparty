from flask import Flask, g, Response

from db import JeopartyDb


app = Flask(__name__)


#####
## Routes
#####


@app.route("/")
def index():
    return "TODO: put the build/ directory's index.html here"


@app.route("/get-player-by-client-id/<clientId>")
def get_player_by_client_id(clientId):
    # For the clientId saved as a cookie in someone's browser, find the existing Player
    # in the db.
    db = getDb()
    playerQuery = f"SELECT * FROM {JeopartyDb.PLAYER} WHERE client_id = ?;"
    player = db.executeAndFetch(playerQuery, (clientId,), doFetchOne=True)

    # If no Player exists yet with that clientId, create a Player with it.
    if player is None:
        playerInsertQuery = f"INSERT INTO {JeopartyDb.PLAYER} (client_id) VALUES (?);"
        db.executeAndCommit(playerInsertQuery, (clientId,))
        player = db.executeAndFetch(playerQuery, (clientId,), doFetchOne=True)

    # Send back the Player that was either found or created.
    return {"player": player}


@app.route("/get-questions")
def get_questions():
    return {"questions": ["He concocted the first potion.", "A hairy tomato."]}


@app.route("/init-game")
def init_game():
    ## TODO: fetch clues and ish from jarchive and populate debbie (source game,
    ##      category, clue)
    return Response(status=404)


#####
## App Lifecycle
#####


@app.before_first_request
def init_db():
    JeopartyDb.clearAll()
    db = getDb()
    db.createTables()


@app.teardown_appcontext
def close_connection(exception):
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
