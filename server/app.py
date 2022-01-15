import time
from flask import Flask

app = Flask(__name__)


@app.route("/")
def index():
    return "TODO: put the build/ directory's index.html here"


@app.route("/fetch-questions")
def get_current_time():
    return {"questions": ["hi..."]}
