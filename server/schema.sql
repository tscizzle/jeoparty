CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    browser_id INTEGER UNIQUE NOT NULL,
    room_id INTEGER,  -- foreign key
    is_host BOOLEAN,
    name TEXT,
    FOREIGN KEY(room_id) REFERENCES room(room_id)
);

CREATE TABLE room (
    id INTEGER PRIMARY KEY,
    source_game_id INTEGER NOT NULL,  -- foreign key
    room_code TEXT NOT NULL,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
);

CREATE TABLE source_game (
    id INTEGER PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    jarchive_id TEXT UNIQUE NOT NULL
);

CREATE TABLE category (
    id INTEGER PRIMARY KEY,
    source_game_id INTEGER NOT NULL,  -- foreign key
    col_order_index INTEGER,
    text TEXT NOT NULL,
    round_type TEXT NOT NULL,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id),
    CHECK (round_type IN ('single','double','final'))
);

CREATE TABLE clue (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL,  -- foreign key
    source_game_id INTEGER,  -- foreign key
    clue TEXT,
    answer TEXT,
    money INTEGER,
    FOREIGN KEY(category_id) REFERENCES category(id),
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
);

CREATE TABLE submission (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- foreign key
    clue_id INTEGER NOT NULL,  -- foreign key
    room_id INTEGER NOT NULL,  -- foreign key
    text TEXT,
    is_correct BOOLEAN DEFAULT 0,
    is_fake_guess BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES user(id),
    FOREIGN KEY(clue_id) REFERENCES clue(id),
    FOREIGN KEY(room_id) REFERENCES room(id)
);
