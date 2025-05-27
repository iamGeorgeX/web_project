import Database from 'better-sqlite3';

try {
    const db = new Database('model/db.sqlite', { verbose: console.log });


    const schema = `
    PRAGMA foreign_keys = ON;

    -- Organizers
    CREATE TABLE IF NOT EXISTS organizers (
        AFM INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        phone INTEGER,
        email TEXT UNIQUE NOT NULL,
        IBAN TEXT,
        password TEXT NOT NULL,
        address TEXT
    );

    -- Space types (e.g., Theater, Cinema, Stadium)
    CREATE TABLE IF NOT EXISTS space_types (
        name TEXT PRIMARY KEY
    );

    -- Spaces (venues); parking treated as boolean (0 = false, 1 = true)
    -- The 'characteristics' column stores a bitmask (in hex format) which represents the seating layout.
    CREATE TABLE IF NOT EXISTS spaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        name TEXT,
        parking BOOLEAN,
        characteristics INTEGER,
        type_name TEXT,
        FOREIGN KEY (type_name) REFERENCES space_types(name)
        
    );

    -- Zones within a space.
    CREATE TABLE IF NOT EXISTS zones (
        
        name TEXT NOT NULL,
        upper_left_y INTEGER NOT NULL,
        upper_left_x INTEGER NOT NULL,
        down_right_x INTEGER NOT NULL,
        down_right_y INTEGER NOT NULL,
        space_id INTEGER NOT NULL,
        PRIMARY KEY(name, space_id)
        FOREIGN KEY (space_id) REFERENCES spaces(id)
        
    );

    -- Events in a specific zone.
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        space_id INTEGER NOT NULL,
        organizer_id INTEGER NOT NULL,
        dates TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        duration INTEGER,
        image BLOB,
        category TEXT,
        FOREIGN KEY (space_id) REFERENCES spaces(id),
        FOREIGN KEY (organizer_id) REFERENCES organizers(AFM)
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        lastname TEXT NOT NULL,
        password TEXT NOT NULL
        
    );

    

    -- Tickets
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        row_index INTEGER NOT NULL,
        number_index INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('available', 'sold')),
        FOREIGN KEY (event_id, row_index, number_index) REFERENCES seats(event_id, row, number),
        UNIQUE (event_id, row_index, number_index)
    );

    -- NEW: Dedicated table for individual seats (elegant approach)
    CREATE TABLE IF NOT EXISTS seats (
        number INTEGER  NOT NULL,
        event_id INTEGER NOT NULL,
        row INTEGER NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id),
        PRIMARY KEY (event_id, row, number)
    );

    CREATE TABLE IF NOT EXISTS set_value (
        value INTEGER NOT NULL,
        event_id INTEGER NOT NULL,
        zone_name TEXT NOT NULL,
        space_id INTEGER NOT NULL,
        FOREIGN KEY (zone_name, space_id) REFERENCES zones(name, space_id),
        FOREIGN KEY (event_id) REFERENCES events(id),
        PRIMARY KEY (event_id, zone_name)
    );
     
     CREATE TABLE IF NOT EXISTS ticket_logs(
        user_id INTEGER NOT NULL,
        ticket_id INTEGER NOT NULL,
        time DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        PRIMARY KEY (user_id, ticket_id)

    );

    `;

    db.exec(schema);


    db.close();

} catch (err) {
    throw err;
}