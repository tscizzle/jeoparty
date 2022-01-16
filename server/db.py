import os
import sqlite3


DB_PATH = "jeoparty.db"


class JeopartyDb:
    """Object that represents a connection to our SQLite db."""

    def __init__(self):
        """Create a connection to the db."""
        self.conn = sqlite3.connect(DB_PATH)

    def executeAndCommit(self, *executeArgs):
        """Execute a SQL command and commit to the db.

        :params *executeArgs: Same params as sqlite3.Cursor.execute (first param is SQL
            string, second is tuple if SQL args). SQL string is probs an INSERT or
            UPDATE or something that writes to the db.

        :return int lastRowId: Integer primary key of the last row inserted, if this is
            an INSERT statement. If there is no explicitly defined primary key column,
            the implicit "rowid" column is used.
        """
        cur = self.conn.cursor()
        cur.execute(*executeArgs)
        self.conn.commit()
        return cur.lastrowid

    def executeScriptAndCommit(self, *executeScriptArgs):
        """Execute a SQL script (multiple SQL commands) and commit to the db.

        :params *executeArgs: Same params as sqlite3.Cursor.execute (first param is SQL
            string, second is tuple if SQL args). SQL string is probs an INSERT or
            UPDATE or something that writes to the db.
        """
        cur = self.conn.cursor()
        cur.executescript(*executeScriptArgs)
        self.conn.commit()

    def executeAndFetch(self, *executeArgs):
        """Execute a SQL query and fetch the results.

        :params *executeArgs: Same params as sqlite3.Cursor.execute (first param is SQL
            string, second is tuple if SQL args). SQL string is probs a SELECT or
            something that reads from the db.

        :return list:
        """
        cur = self.conn.cursor()
        cur.execute(*executeArgs)
        results = cur.fetchall()
        return results

    def close(self):
        """Close this connection to the db."""
        self.conn.close()

    def createTables(self):
        """Create all the db tables based on the .sql file defining our schema."""
        print("Creating database...")
        with open("schema.sql", "r") as f:
            schemaCreationSqlScript = f.read()
        self.executeScriptAndCommit(schemaCreationSqlScript)
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
