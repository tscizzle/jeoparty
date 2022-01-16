from flask import Flask, g, request, Response

import os

from db import JeopartyDb


app = Flask(__name__)


#####
## Routes
#####


@app.route("/")
def index():
    return "TODO: put the build/ directory's index.html here"


@app.route("/get-questions")
def get_questions():
    return {"questions": ["He concocted the first potion.", "A hairy tomato."]}


@app.route("/init-game")
def init_game():
    ## TODO: fetch clues and ish from jarchive and populate debbie (source game,
    ##      category, clue)
    return Response(status=404)


## LEAVING HERE ONLY AS EXAMPLE. REMOVE ONCE A REAL EXAMPLE EXISTS.
# @app.route("/click-question", methods=["POST"])
# def click_question():
#     content = request.get_json()
#     question = content["question"]
#     executeAndCommit(
#         """
#         INSERT INTO ClickedQuestions(question) VALUES (?)
#             ON CONFLICT(question) DO UPDATE
#             SET numClicks = numClicks + 1
#         """,
#         (question,),
#     )
#     print(executeAndFetch("SELECT * FROM ClickedQuestions"))
#     return Response(status=200)


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
    if db is not None:
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
