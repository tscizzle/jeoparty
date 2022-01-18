CREATE TABLE player (
    id INTEGER PRIMARY KEY,
    room_id INTEGER,  -- foreign key
    client_id INTEGER UNIQUE,
    name TEXT,
    FOREIGN KEY(room_id) REFERENCES room(id)
);

CREATE TABLE room (
    id INTEGER PRIMARY KEY,
    source_game_id INTEGER,  -- foreign key
    room_code TEXT NOT NULL,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
);

CREATE TABLE source_game (
    id INTEGER PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    jarchive_id TEXT NOT NULL
);

CREATE TABLE category (
    id INTEGER PRIMARY KEY,
    source_game_id INTEGER NOT NULL,  -- foreign key
    col_order_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    round_type TEXT NOT NULL,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id),
    CHECK (round_type IN ('single','double','final'))
);

CREATE TABLE clue (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL,  -- foreign key
    source_game_id INTEGER,  -- foreign key
    text TEXT NOT NULL,
    money INTEGER NOT NULL,
    FOREIGN KEY(category_id) REFERENCES category(id),
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
);

CREATE TABLE submission (
    id INTEGER PRIMARY KEY,
    player_id INTEGER NOT NULL,  -- foreign key
    clue_id INTEGER NOT NULL,  -- foreign key
    room_id INTEGER NOT NULL,  -- foreign key
    text TEXT,
    is_correct BOOLEAN DEFAULT 0,
    is_fake_guess BOOLEAN DEFAULT 0,
    FOREIGN KEY(player_id) REFERENCES player(id),
    FOREIGN KEY(clue_id) REFERENCES clue(id),
    FOREIGN KEY(room_id) REFERENCES room(id)
);
