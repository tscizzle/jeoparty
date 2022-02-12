CREATE SCHEMA jeoparty;

CREATE TABLE jeoparty.source_game (
    id SERIAL PRIMARY KEY,
    taped_date TEXT NOT NULL,
    jarchive_id TEXT UNIQUE NOT NULL
);

CREATE TABLE jeoparty.category (
    id SERIAL PRIMARY KEY,
    col_order_index INTEGER,
    source_game_id INTEGER REFERENCES jeoparty.source_game(id),
    text TEXT NOT NULL,
    round_type TEXT NOT NULL,
    CHECK(round_type IN ('single','double','final'))
);

CREATE TABLE jeoparty.clue (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES jeoparty.category(id),
    source_game_id INTEGER REFERENCES jeoparty.source_game(id),
    clue TEXT,
    answer TEXT,
    money INTEGER,
    is_daily_double BOOLEAN DEFAULT false
);

CREATE TABLE jeoparty.room (
    id SERIAL PRIMARY KEY,
    source_game_id INTEGER REFERENCES jeoparty.source_game(id),
    current_clue_id INTEGER REFERENCES jeoparty.clue(id),
    room_code TEXT NOT NULL,
    has_game_been_started BOOLEAN DEFAULT false,
    current_clue_stage TEXT,
    CHECK(current_clue_stage IN ('preparing','answering','grading','finished'))
);

CREATE TABLE jeoparty.user (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES jeoparty.room(id),
    browser_id TEXT UNIQUE NOT NULL,
    is_host BOOLEAN,
    registered_name TEXT,
    image_blob TEXT
);

CREATE TABLE jeoparty.reached_clue (
    id SERIAL PRIMARY KEY,
    clue_id INTEGER REFERENCES jeoparty.clue(id),
    room_id INTEGER REFERENCES jeoparty.room(id),
    reached_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jeoparty.submission (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES jeoparty.user(id),
    clue_id INTEGER REFERENCES jeoparty.clue(id),
    room_id INTEGER REFERENCES jeoparty.room(id),
    text TEXT,
    graded_as TEXT,
    is_fake_guess BOOLEAN DEFAULT false,
    CHECK(graded_as IN ('correct','incorrect','blank')),
    UNIQUE(user_id, clue_id, room_id)
);
