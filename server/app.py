from flask import Flask, g, request

import os

import sqlite3

STATE_DATABASE = "state.db"


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


@app.route("/click-question", methods=["POST"])
def click_question():
    print(request.is_json)
    content = request.get_json()
    print(content)
    return content


#####
## App Lifecycle
#####


@app.before_first_request
def clear_state_db():
    try:
        print("Clearing state database...")
        os.remove("state.db")
        print("Cleared state database.")
    except OSError:
        print("No state database to clear.")
        pass


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_state_database", None)
    if db is not None:
        db.close()


#####
## State Database Helpers
#####


def get_state_db():
    db = getattr(g, "_state_database", None)
    if db is None:
        db = g._state_database = sqlite3.connect(STATE_DATABASE)
    return db
