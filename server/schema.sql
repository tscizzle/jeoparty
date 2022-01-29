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
    has_game_been_started BOOLEAN DEFAULT 0,
    current_clue_id INTEGER,  -- foreign key
    current_clue_stage TEXT,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
    FOREIGN KEY(current_clue_id) REFERENCES clue(id)
    CHECK(clue_stage IN ('answering','grading'))
);

CREATE TABLE source_game (
    id INTEGER PRIMARY KEY,
    taped_date TEXT NOT NULL,
    jarchive_id TEXT UNIQUE NOT NULL
);

CREATE TABLE category (
    id INTEGER PRIMARY KEY,
    source_game_id INTEGER NOT NULL,  -- foreign key
    col_order_index INTEGER,
    text TEXT NOT NULL,
    round_type TEXT NOT NULL,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id),
    CHECK(round_type IN ('single','double','final'))
);

CREATE TABLE clue (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL,  -- foreign key
    source_game_id INTEGER,  -- foreign key
    clue TEXT,
    answer TEXT,
    money INTEGER,
    is_daily_double BOOLEAN DEFAULT 0,
    FOREIGN KEY(category_id) REFERENCES category(id),
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
);

CREATE TABLE reached_clue (
    id INTEGER PRIMARY KEY,
    clue_id INTEGER NOT NULL,  -- foreign key
    room_id INTEGER NOT NULL,  -- foreign key
    reached_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(clue_id) REFERENCES clue(id),
    FOREIGN KEY(room_id) REFERENCES room(id)
);

CREATE TABLE submission (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- foreign key
    clue_id INTEGER NOT NULL,  -- foreign key
    room_id INTEGER NOT NULL,  -- foreign key
    text TEXT,
    is_correct BOOLEAN DEFAULT null,
    is_fake_guess BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES user(id),
    FOREIGN KEY(clue_id) REFERENCES clue(id),
    FOREIGN KEY(room_id) REFERENCES room(id),
    UNIQUE(user_id, clue_id, room_id)
);

