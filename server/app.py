import time
from flask import Flask

app = Flask(__name__)


@app.route("/fetch-questions")
def get_current_time():
    return {"questions": ["hi..."]}
