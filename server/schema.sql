CREATE TABLE room (
    id INTEGER IDENTITY PRIMARY KEY NOT NULL,
    source_game_id INTEGER,  -- foreign key
    room_code TEXT,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
);


CREATE TABLE submission (
    id INTEGER IDENTITY PRIMARY KEY NOT NULL,
    player_id INTEGER,  -- foreign key
    clue_id INTEGER,  -- foreign key
    room_id INTEGER,  -- foreign key
    text TEXT,
    is_correct BOOLEAN,
    is_fake_guess BOOLEAN,
    FOREIGN KEY(player_id) REFERENCES player(id),
    FOREIGN KEY(clue_id) REFERENCES clue(id),
    FOREIGN KEY(room_id) REFERENCES room(id)
);

CREATE TABLE player (
    id INTEGER IDENTITY PRIMARY KEY NOT NULL,
    room_id INTEGER,  -- foreign key
    name TEXT,
    FOREIGN KEY(room_id) REFERENCES room(id)
);

CREATE TABLE clue (
    id INTEGER IDENTITY PRIMARY KEY NOT NULL,
    category_id INTEGER,  -- foreign key
    source_game_id INTEGER,  -- foreign key
    text TEXT,
    money INTEGER,
    FOREIGN KEY(category_id) REFERENCES category(id),
    FOREIGN KEY(source_game_id) REFERENCES source_game(id)
);

CREATE TABLE source_game (
    id INTEGER IDENTITY PRIMARY KEY NOT NULL,
    date TIMESTAMP
    jarchive_id TEXT

);

CREATE TABLE category (
    id INTEGER IDENTITY PRIMARY KEY NOT NULL,
    source_game_id INTEGER,  -- foreign key
    col_order_index INTEGER,
    text TEXT,
    round_type TEXT,
    FOREIGN KEY(source_game_id) REFERENCES source_game(id),
    CHECK (round_type IN ('single','double','final'))
);
