CREATE SCHEMA jeoparty;

CREATE TABLE jeoparty.room(
    id INT IDENTITY PRIMARY KEY NOT NULL,
    source_game_id int FOREIGN KEY REFERENCES jeoparty.source_game(id),
    room_code TEXT

);

CREATE TABLE jeoparty.submission(
    id INT IDENTITY PRIMARY KEY NOT NULL,
    player_id int FOREIGN KEY REFERENCES jeoparty.player(id),
    clue_id int FOREIGN KEY REFERENCES jeoparty.clue(id),
    room_id int FOREIGN KEY REFERENCES jeoparty.room(id),
    text TEXT,
    is_correct BOOLEAN,
    is_fake_guess BOOLEAN

);

CREATE TABLE jeoparty.player(
    id INT IDENTITY PRIMARY KEY NOT NULL,
    room_id int FOREIGN KEY REFERENCES jeoparty.room(id),
    name TEXT

);

CREATE TABLE jeoparty.clue(
    id INT IDENTITY PRIMARY KEY NOT NULL,
    category_id int FOREIGN KEY REFERENCES jeoparty.category(id),
    source_game_id int FOREIGN KEY REFERENCES jeoparty.source_game(id),
    text TEXT
    money INTEGER
);

CREATE TABLE jeoparty.source_game(
    id INT IDENTITY PRIMARY KEY NOT NULL,
    date TIMESTAMP
    jarchive_id TEXT

);

CREATE TABLE jeoparty.category(
    id INT IDENTITY PRIMARY KEY NOT NULL,
    source_game_id int FOREIGN KEY REFERENCES jeoparty.source_game(id),
    col_order_index INTEGER,
    text TEXT,
    round_type TEXT
);

ALTER TABLE jeoparty.category
    ADD CONSTRAINT category_round_type_constraint CHECK (round_type IN ('single','double','final'));
