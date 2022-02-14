import os
import psycopg2
import psycopg2.extras


class JeopartyDb:
    """Object that represents a connection to our SQLite db."""

    SCHEMA = "jeoparty"
    # Table names
    USER = f"{SCHEMA}.user"
    ROOM = f"{SCHEMA}.room"
    SOURCE_GAME = f"{SCHEMA}.source_game"
    CATEGORY = f"{SCHEMA}.category"
    CLUE = f"{SCHEMA}.clue"
    REACHED_CLUE = f"{SCHEMA}.reached_clue"
    SUBMISSION = f"{SCHEMA}.submission"

    def __init__(self):
        if os.environ.get("DATABASE_URL"):
            db_url = os.environ["DATABASE_URL"]
            self.conn = psycopg2.connect(db_url)
        else:
            self.conn = psycopg2.connect(database="jeoparty_db")
        """
        commands to run this locally:
        # CREATE DATABASE jeoparty_db;
        # CREATE USER jeoparty_db_user;
        # ALTER USER jeoparty_db_user WITH SUPERUSER;
        """

    #####
    ## General DB Methods
    #####

    def execute_and_commit(self, *execute_args):
        """Execute a SQL command and commit to the db.

        :param *executeArgs: Same params as `sqlite3.Cursor.execute` (first param is SQL
            string, second is tuple if SQL params), or of `sqlite3.Cursor.executescript`
            (which is just the SQL string, no params) if doExecuteScript is True. SQL
            string is probs an INSERT or UPDATE or something that writes to the db.

        :return int lastRowId: Integer primary key of the last row inserted with this
            Cursor. If there is no explicitly defined primary key column, SQLite's
            implicit "rowid" column is used.

        """
        cur = self.conn.cursor()

        cur.execute(*execute_args)

        self.conn.commit()

        # Return the id of the row inserted (if exists)
        try:
            return cur.fetchone()[0]
        except Exception:
            return

    def execute_and_fetch(self, *execute_args, do_fetch_one=False):
        """Execute a SQL query and fetch the results.

        :param *executeArgs: Same params as `sqlite3.Cursor.execute` (first param is SQL
            string, second is tuple if SQL args). SQL string is probs a SELECT or
            something that reads from the db.
        :param bool do_fetch_one: If True, use the method `fetchOne` instead of `fetchAll`
            when retrieving resuls of the query.

        :return sqlite3.Row[]: (if doFetchOne is False)
        :return sqlite3.Row|None: (if doFetchOne is True)
        """
        cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(*execute_args)

        fetch_method = cur.fetchone if do_fetch_one else cur.fetchall
        results = fetch_method()

        return results

    def close(self):
        self.conn.close()

    def create_tables(self):
        print("Creating database...")
        with open("server/schema.sql", "r") as f:
            schema_creation_sql_script = f.read()
        self.execute_and_commit(schema_creation_sql_script)
        print("Created database.")

    def clear_all(self):
        """Delete the entire db."""
        self.execute_and_commit("DROP SCHEMA IF EXISTS jeoparty CASCADE;")

    #####
    ## Common Queries
    #####

    def get_user_by_browser_id(self, browser_id):
        # For the browser_id saved as a cookie in someone's browser, find the existing
        # User in the db.
        user_query = f"SELECT * FROM {JeopartyDb.USER} WHERE browser_id = %s;"
        user_row = self.execute_and_fetch(user_query, (browser_id,), do_fetch_one=True)

        # If no User exists yet with that browser_id, create a User with it.
        if user_row is None:
            user_insert_query = (
                f"INSERT INTO {JeopartyDb.USER} (browser_id) VALUES (%s);"
            )
            try:
                self.execute_and_commit(user_insert_query, (browser_id,))
            except psycopg2.IntegrityError:
                # While trying to create a User, some other function created one,
                # which is fine.
                pass
            user_row = self.execute_and_fetch(
                user_query, (browser_id,), do_fetch_one=True
            )

        # Return the found or created User.
        user = dict(user_row)
        return user

    def get_room_by_browser_id(self, browser_id):
        user = self.get_user_by_browser_id(browser_id)
        room_row = None
        if user["room_id"] is not None:
            room_query = f"SELECT * FROM {JeopartyDb.ROOM} WHERE id = %s;"
            room_id = user["room_id"]
            room_row = self.execute_and_fetch(room_query, (room_id,), do_fetch_one=True)

        room = dict(room_row) if room_row is not None else None
        return room
