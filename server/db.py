import os
import sqlite3


DB_PATH = "jeoparty.db"


class JeopartyDb:
    """Object that represents a connection to our SQLite db."""

    # Table names
    PLAYER = "player"
    ROOM = "room"
    SOURCE_GAME = "source_game"
    CATEGORY = "category"
    CLUE = "clue"
    SUBMISSION = "submission"

    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row

    def execute_and_commit(self, *execute_args, do_execute_script=False):
        """Execute a SQL command and commit to the db.

        :param *executeArgs: Same params as `sqlite3.Cursor.execute` (first param is SQL
            string, second is tuple if SQL params), or of `sqlite3.Cursor.executescript`
            (which is just the SQL string, no params) if doExecuteScript is True. SQL
            string is probs an INSERT or UPDATE or something that writes to the db.
        :param bool do_execute_script: If True, use the method `executescript` instead of
            `execute`, in order to execute multiple SQL statements.

        :return int lastRowId: Integer primary key of the last row inserted with this
            Cursor. If there is no explicitly defined primary key column, SQLite's
            implicit "rowid" column is used.

        """
        cur = self.conn.cursor()

        execute_method = cur.executescript if do_execute_script else cur.execute
        execute_method(*execute_args)

        self.conn.commit()

        return cur.lastrowid

    def execute_and_fetch(self, *execute_args, do_fetch_one=False):
        """Execute a SQL query and fetch the results.

        :param *executeArgs: Same params as `sqlite3.Cursor.execute` (first param is SQL
            string, second is tuple if SQL args). SQL string is probs a SELECT or
            something that reads from the db.
        :param bool do_fetch_one: If True, use the method `fetchOne` instead of `fetchAll`
            when retrieving resuls of the query.

        :return list: (if doFetchOne is False)
        :return dict|None: (if doFetchOne is True)
        """
        cur = self.conn.cursor()

        cur.execute(*execute_args)

        fetch_method = cur.fetchone if do_fetch_one else cur.fetchall
        results = fetch_method()

        return results

    def close(self):
        self.conn.close()

    def create_tables(self):
        print("Creating database...")
        with open("schema.sql", "r") as f:
            schema_creation_sql_script = f.read()
        self.execute_and_commit(schema_creation_sql_script, do_execute_script=True)
        print("Created database.")

    @staticmethod
    def clear_all():
        """Delete the entire db. For SQLite that is just deleting the .db file."""
        print("Clearing database...")
        try:
            os.remove(DB_PATH)
            print("Cleared database.")
        except OSError:
            pass
            print("No database to clear.")
