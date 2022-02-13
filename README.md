# Set up dev environment

Unless otherwise stated, run any instructed commands at the root of this repo in a Terminal.

## Python setup

- With Python 3.8, create a virtual environment in the `.venv/` directory with `python3 -m venv .venv`.
- Enter the environment with `source .venv/bin/activate`.
- Install Python packages with `pip install -r requirements.txt`.
  - If on Linux, before running the `pip install` command, run `sudo apt install python3-dev libpq-dev` (for the package `psycopg2` to work).
- Add a `.flaskenv` file in the root of this repo, and add the line: `FLASK_ENV=development`.

## Javascript setup

- With Node installed (`nvm` is a nice tool to manage multiple Node installations with different versions), install npm packages with `npm install`.

## Database setup

- Install Redis.
- Install Postgres.
