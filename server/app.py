from flask import Flask, g, request, Response

import os

import sqlite3

DB_PATH = "jeoparty.db"


app = Flask(__name__)


#####
## Routes
#####


@app.route("/")
def index():
    return "TODO: put the build/ directory's index.html here"


@app.route("/fetch-questions")
def fetch_questions():
    return {"questions": ["He concocted the first potion.", "A hairy tomato."]}


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
    try:
        print("Clearing database...")
        os.remove(DB_PATH)
        print("Cleared database.")
    except OSError:
        print("No database to clear.")
        pass

    with open("schema.sql", "r") as f:
        schemaCreationSqlScript = f.read()
        executeScriptAndCommit(schemaCreationSqlScript)


@app.teardown_appcontext
def close_connection(exception):
    dbConn = getDbConn()
    if dbConn is not None:
        dbConn.close()


#####
## Database Helpers
#####


def getDbConn():
    """Get this Flask app's connection to our SQLite db.
        - If such a connection already exists, use the existing one.
        - If not, create a connection.

    :return sqlite3.Connection:
    """
    dbConn = getattr(g, "_database", None)
    if dbConn is None:
        dbConn = g._database = sqlite3.connect(DB_PATH)
    return dbConn


def executeAndCommit(*executeArgs):
    """Execute a SQL command and commit to the db.

    :params *executeArgs: Same params as sqlite3.Cursor.execute (first param is SQL
        string, second is tuple if SQL args). SQL string is probs an INSERT or UPDATE or
        something that writes to the db.
    """
    dbConn = getDbConn()
    cur = dbConn.cursor()
    cur.execute(*executeArgs)
    dbConn.commit()


def executeScriptAndCommit(*executeScriptArgs):
    """Execute a SQL script (multiple SQL commands) and commit to the db.

    :params *executeArgs: Same params as sqlite3.Cursor.execute (first param is SQL
        string, second is tuple if SQL args). SQL string is probs an INSERT or UPDATE or
        something that writes to the db.
    """
    dbConn = getDbConn()
    cur = dbConn.cursor()
    cur.executescript(*executeScriptArgs)
    dbConn.commit()


def executeAndFetch(*executeArgs):
    """Execute a SQL query and fetch the results.

    :params *executeArgs: Same params as sqlite3.Cursor.execute (first param is SQL
        string, second is tuple if SQL args). SQL string is probs a SELECT or something
        that reads from the db.

    :return list:
    """
    dbConn = getDbConn()
    cur = dbConn.cursor()
    cur.execute(*executeArgs)
    results = cur.fetchall()
    return results
