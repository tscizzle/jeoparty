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
        """Create a connection to the db."""
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row

    def executeAndCommit(self, *executeArgs, doExecuteScript=False):
        """Execute a SQL command and commit to the db.

        :param *executeArgs: Same params as `sqlite3.Cursor.execute` (first param is SQL
            string, second is tuple if SQL params), or of `sqlite3.Cursor.executescript`
            (which is just the SQL string, no params) if doExecuteScript is True. SQL
            string is probs an INSERT or UPDATE or something that writes to the db.
        :param bool doExecuteScript: If True, use the method `executescript` instead of
            `execute`, in order to execute multiple SQL statements.

        :return int lastRowId: Integer primary key of the last row inserted with this
            Cursor. If there is no explicitly defined primary key column, SQLite's
            implicit "rowid" column is used.

        """
        cur = self.conn.cursor()

        executeMethod = cur.executescript if doExecuteScript else cur.execute
        executeMethod(*executeArgs)

        self.conn.commit()

        return cur.lastrowid

    def executeAndFetch(self, *executeArgs, doFetchOne=False):
        """Execute a SQL query and fetch the results.

        :param *executeArgs: Same params as `sqlite3.Cursor.execute` (first param is SQL
            string, second is tuple if SQL args). SQL string is probs a SELECT or
            something that reads from the db.
        :param bool doFetchOne: If True, use the method `fetchOne` instead of `fetchAll`
            when retrieving resuls of the query.

        :return list: (if doFetchOne is False)
        :return dict|None: (if doFetchOne is True)
        """
        cur = self.conn.cursor()

        cur.execute(*executeArgs)

        fetchMethod = cur.fetchone if doFetchOne else cur.fetchall
        results = fetchMethod()

        return results

    def close(self):
        """Close this connection to the db."""
        self.conn.close()

    def createTables(self):
        """Create all the db tables based on the .sql file defining our schema."""
        print("Creating database...")
        with open("schema.sql", "r") as f:
            schemaCreationSqlScript = f.read()
        self.executeAndCommit(schemaCreationSqlScript, doExecuteScript=True)
        print("Created database.")

    @staticmethod
    def clearAll():
        """Delete the entire db. For SQLite that is just deleting the .db file."""
        print("Clearing database...")
        try:
            os.remove(DB_PATH)
            print("Cleared database.")
        except OSError:
            pass
            print("No database to clear.")
