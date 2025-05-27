'use strict';
import { default as bettersqlite3 } from 'better-sqlite3';
import fs from 'fs';
import argon2  from 'argon2';
import { get } from 'http';
import { de } from '@faker-js/faker';


// const db = new bettersqlite3(`${import.meta.dirname}./model/sqlite/database.sqlite`, { fileMustExist: true });
const db = new bettersqlite3('model/db.sqlite');

const getSeatsForEvent = (eventId) => {
    try {
        const stmt = db.prepare(`
          SELECT 
            s.row, 
            s.number, 
            COALESCE(t.status, 'available') AS status
          FROM seats s
          LEFT JOIN tickets t 
            ON s.event_id = t.event_id 
            AND s.row = t.row_index 
            AND s.number = t.number_index
          WHERE s.event_id = ?
          ORDER BY s.row, s.number
        `);
        return stmt.all(eventId);
    } catch (err) {
        throw err;
    }
};

const getEventsByCategory = (category) => {
   try {
      const stmt = db.prepare(`
      SELECT 
        e.id, 
        e.title, 
        e.dates AS date, 
        e.image, 
        s.location AS place
      FROM events e
      JOIN spaces s ON e.space_id = s.id
      WHERE e.category = ?
    `);
      const events = stmt.all(category);
      
      // Convert image to base64
      events.forEach(event => {
         if (event.image) {
            event.image = "data:image/png;base64," + event.image.toString("base64");
         } else {
            event.image = "/images/default_event.png";
         }
      });
      return events;
   } catch (err) {
      throw err;
   }
};

const getEventsByUser = (userId) => {
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT e.id, e.title, e.description, e.dates, e.image
      FROM events AS e
      JOIN tickets AS t ON e.id = t.event_id
      JOIN ticket_logs AS tl ON t.id = tl.ticket_id
      WHERE tl.user_id = ?
    `);
    const events = stmt.all(userId);
    return events;
  } catch (err) {
    throw err;
  }
};

const getSeatAndTickets=(event_id) => {
   const seatNumbers = Array.from({ length: 15 }, (_, i) => i + 1); // 1 to 11
   const seatRows = Array.from({ length: 11 }, (_, i) => i + 1);    // 1 to 15
   for (let row of seatRows) {
      for (let number of seatNumbers) {
         let seatStmt = db.prepare(`INSERT INTO seats (number, event_id, row) VALUES (?, ?, ?)`);
         seatStmt.run(number, event_id, row);
         let ticketStmt = db.prepare(`INSERT INTO tickets (event_id, row_index, number_index, status) VALUES (?, ?, ?, ?)`);
         ticketStmt.run(event_id, row, number, 'available');
      }
   }
}

const getEventById = (id) => {
   try {
      const stmt = db.prepare("SELECT id, organizer_id, dates, space_id, title, description, duration, image, category FROM events WHERE id = ? LIMIT 1");
      const event = stmt.get(id);
      return event;
   } catch (err) {
      throw err;
   }
};

const getEventsByOrganiserId = (organiserId) => {
   try {
      const stmt = db.prepare("SELECT id, organizer_id, dates, space_id, title, description, duration, image, category FROM events WHERE organizer_id = ?");
      const events = stmt.all(organiserId);
      return events;
   } catch (err) {
      throw err;
   }
};

const getUserById = (userId) => {
   try {
      const stmt = db.prepare("SELECT id, name, lastname, email FROM users WHERE id = ? LIMIT 1");
      const user = stmt.get(userId);
      return user;
   } catch (err) {
      throw err;
   }
}

const getOrganiserById = (organiserId) => {
    try {
        const stmt = db.prepare("SELECT AFM, name, phone, email, IBAN, address FROM organizers WHERE AFM = ? LIMIT 1");
        const organiser = stmt.get(organiserId);
        return organiser;
    } catch (err) {
        throw err;
    }
  }
const getEvents = () => {
   try {
      const stmt = db.prepare("SELECT id, title, description, dates, image FROM events");
      const events = stmt.all();
      return events;
   } catch (err) {
      throw err;
   }
};


const updateUserPassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await argon2.hash(newPassword);
    const stmt = db.prepare("UPDATE users SET password = ? WHERE id = ?");
    const result = stmt.run(hashedPassword, userId);
    return result.changes > 0;
  } catch (err) {
    throw err;
  }
};

async function verifyUserPassword(userId, oldPassword) {
  try {
    const stmt = db.prepare("SELECT password FROM users WHERE id = ?");
    const row = stmt.get(userId);
    if (!row) return false;
    // Use argon2.verify to compare the stored hash with the provided password.
    return await argon2.verify(row.password, oldPassword);
  } catch (err) {
    throw err;
  }
}

const updateOrganiserPassword = async (organiserId, newPassword) => {
  try {

    const hashedPassword = await argon2.hash(newPassword);
    const stmt = db.prepare("UPDATE organizers SET password = ? WHERE AFM = ?");
    const result = stmt.run(hashedPassword, organiserId);
    // If one row was updated, return true.
    return result.changes > 0;
  } catch (err) {
    throw err;
  }
};

async function verifyOrganiserPassword(organiserId, oldPassword) {
  try {
    const stmt = db.prepare("SELECT password FROM organizers WHERE AFM = ?");
    const row = stmt.get(organiserId);
    if (!row) return false;
    // Use argon2.verify to compare the stored hash with the provided password.
    return await argon2.verify(row.password, oldPassword);
  } catch (err) {
    throw err;
  }
}

const  registerUser = async (name, lastname, password, email) => {
   try {

      // Check if email exists in user
      let stmt = db.prepare("SELECT email FROM users WHERE email = ? LIMIT 1");
      let user = stmt.get(email);
      if (user) {
         return { result: null, message: 'Το e-mail ηδη υπαρχει ' };
      }

      // Insert new user
      const hashedPassword = await argon2.hash(password);
      stmt = db.prepare("INSERT INTO users (name, lastname, password, email) VALUES (?, ?, ?, ?)");
      const info = stmt.run(name,lastname, hashedPassword, email);

      return { result: true, message: 'User registered', id: info.lastInsertRowid };
   } catch (err) {
      throw err;
   }
};

const registerOrganiser = async (form) => {
  try {
    // Destructure the required properties from the form object
    const {
      organization_name,
      organization_address,
      organization_phone,
      email,
      afm,
      payment_details,
      password
    } = form;
    
    // Check if email already exists in organizers table
    let stmt = db.prepare("SELECT email FROM organizers WHERE email = ? LIMIT 1");
    let organiser = stmt.get(email);
    if (organiser) {
      return { result: null, message: 'Το e-mail ηδη υπαρχει ' };
    }
    
    // Optionally check if organiser name already exists
    stmt = db.prepare("SELECT AFM FROM organizers WHERE AFM = ? LIMIT 1");
    organiser = stmt.get(afm);
    if (organiser) {
      return { result: null, message: 'Ο διοργανωτης ηδη υπαρχει' };
    }
    
    // Hash the password before storing it
    const hashedPassword = await argon2.hash(password);
    
    // Insert new organiser into the organizers table.
    // Mapping: AFM ← afm, name ← organization_name, phone ← organization_phone,
    // email ← email, IBAN ← payment_details, password ← hashedPassword, address ← organization_address
    stmt = db.prepare(
      "INSERT INTO organizers (AFM, name, phone, email, IBAN, password, address) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run(
      parseInt(afm),  // Convert AFM to a number if needed
      organization_name,
      organization_phone,
      email,
      payment_details,
      hashedPassword,
      organization_address
    );
    
    return { result: true, message: 'Organiser registered' };
  } catch (err) {
    throw err;
  }
};

const doLogin = async (email, password) => {
  try {
    // Check organizers table first.
    let organiserStmt = db.prepare("SELECT AFM as id, name, password FROM organizers WHERE email = ? LIMIT 1");
    let organiser = organiserStmt.get(email);
    if (organiser) {
      const match = await argon2.verify(organiser.password, password);
      if (match) {

        return {
          id: organiser.id,   // This becomes organiser_id in the session.
          name: organiser.name,
          role: 'organiser'
        };
      }
    }
    
    // Check users table next.
    let userStmt = db.prepare("SELECT id, name, password FROM users WHERE email = ? LIMIT 1");
    let user = userStmt.get(email);
    if (user) {
      const match = await argon2.verify(user.password, password);
      if (match) {

        return {
          id: user.id,
          name: user.name,
          role: 'user'
        };
      }
    }
    
    return {
      id: null,
      message: 'email ή κωδικός δεν είναι σωστά',
      role: null
    };
  } catch (err) {
    throw err;
  }
};

const deleteEvent = (id) => {
   try {
        // Delete ticket logs for tickets belonging to this event
        const ticketLogsStmt = db.prepare(`
           DELETE FROM ticket_logs 
           WHERE ticket_id IN (SELECT id FROM tickets WHERE event_id = ?)
        `);
        ticketLogsStmt.run(id);

        // Delete tickets for the event
        const ticketsStmt = db.prepare("DELETE FROM tickets WHERE event_id = ?");
        ticketsStmt.run(id);
        
        // Delete seats for the event
        const seatsStmt = db.prepare("DELETE FROM seats WHERE event_id = ?");
        seatsStmt.run(id);
        
        // Delete set_value rows for the event
        const setValueStmt = db.prepare("DELETE FROM set_value WHERE event_id = ?");
        setValueStmt.run(id);
        
        // Delete the event finally
        const eventStmt = db.prepare("DELETE FROM events WHERE id = ?");
        eventStmt.run(id);
      
        return true;
   } catch (err) {
      throw err;
   }
};

const newEvent = (eventData) => {
  try {
    // Insert event (without zone pricing columns)
    const eventStmt = db.prepare(`
      INSERT INTO events (
        space_id, organizer_id, dates, title, description, image, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const eventResult = eventStmt.run(
      Number(eventData.space_id),
      eventData.organizer_id,
      eventData.dates,
      eventData.title,
      eventData.description,
      eventData.image,
      eventData.category
    );
    
    // Get the newly inserted event's id
    const eventId = eventResult.lastInsertRowid;
    
    // Map your keys from the form to the actual zone names present in your zones table.
    // Adjust the mapping to use the exact names in your zones table.
    const zoneMap = {
      zoneA: "ZoneA",  // Instead of "ZoneΑ"
      zoneB: "ZoneB",  // Instead of "ZoneΒ"
      zoneC: "ZoneC"
    };

    // Insert zone pricing into the set_value table for each zone.
    const insertZoneStmt = db.prepare(`
      INSERT INTO set_value (event_id, zone_name, value, space_id)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const zoneKey in eventData.zonePrices) {
      const zoneName = zoneMap[zoneKey];
      const price = eventData.zonePrices[zoneKey];
      insertZoneStmt.run(eventId, zoneName, price, Number(eventData.space_id));
    }
    getSeatAndTickets(eventId); // Call to create seats and tickets for the event
    return true;
  } catch (err) {
    throw err;
  }
};


const updateEvent = (form) => {
   try {
      const stmt = db.prepare(
         `UPDATE events SET
         (title, description, id, organizer_id, duration, space_id, dates, image, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      stmt.run(
         form.title,
         form.description,
         form.id,
         form.organizer_id,
         form.duration,
         form.space_id,
         form.dates,
         form.image,
         form.category
      );
      return true;
   } catch (err) {
      throw err;
   }
};


const getPopularEvents = () => {
  try {
    const stmt = db.prepare(`
      SELECT 
        e.id, 
        e.title, 
        e.dates AS date, 
        e.image, 
        s.location AS place,
        COUNT(t.id) AS tickets
      FROM events e
      JOIN spaces s ON e.space_id = s.id
      LEFT JOIN tickets t ON e.id = t.event_id
      GROUP BY e.id
      ORDER BY tickets DESC
      LIMIT 4
    `);
    const events = stmt.all();
    // Convert the image field for each event
    events.forEach(event => {
      if(event.image) {
        event.image = "data:image/png;base64," + event.image.toString("base64");
      } else {
        event.image = "/images/default_event.png";
      }
    });
    return events;
  } catch (err) {
    throw err;
  }
};

const getSliderEvents = () => {
  try {
    // Select 4 random events as slider events; adjust ORDER BY clause as needed
    const stmt = db.prepare(`
      SELECT 
        e.id, 
        e.title, 
        e.dates AS date, 
        e.image, 
        s.location AS place
      FROM events e
      JOIN spaces s ON e.space_id = s.id
      ORDER BY RANDOM()
      LIMIT 4
    `);
    const events = stmt.all();
    // Convert the image field for each event
    events.forEach(event => {
      if (event.image) {
        event.image = "data:image/png;base64," + event.image.toString("base64");
      } else {
        event.image = "/images/default_event.png";
      }
    });
    return events;
  } catch (err) {
    throw err;
  }
};


const getCategories = () => {
  try {
    const stmt = db.prepare("SELECT DISTINCT category FROM events");
    const categories = stmt.all().map(row => row.category);
    // Return fallback categories if the DB query returns none.
    if (categories.length === 5) {
      return categories;
    }
    return ["Εκδηλώσεις", "Θέατρο", "Μουσική", "Αθλητικά", "Σινεμά"];
  } catch (err) {
    throw err;
  }
}
const getSpaces = () => {
  try {
    // Retrieve id, location (city) and name from spaces.
    const stmt = db.prepare("SELECT id, location, name FROM spaces");
    return stmt.all();
  } catch (err) {
    throw err;
  }
}

const getZonesForSpace = (spaceId) => {
  try {
    // Using the zones table, map upper_left_y to row_start and down_right_y to row_end.
    const stmt = db.prepare("SELECT name AS zone_name, upper_left_y AS row_start, down_right_y AS row_end FROM zones WHERE space_id = ?");
    return stmt.all(spaceId);
  } catch (err) {
    throw err;
  }
};

export {
   getEventsByCategory,
   getEventsByUser,
   getEventById,
   getEventsByOrganiserId,
   getUserById,
    getOrganiserById,
   getEvents,
   registerUser,
   doLogin,
   deleteEvent,
   newEvent,
   updateEvent,
   getPopularEvents,
   getSliderEvents,
   registerOrganiser,
   getSeatsForEvent,
    getCategories,
    getSpaces,
    getZonesForSpace,
    updateUserPassword,
    verifyUserPassword,
    updateOrganiserPassword,
    verifyOrganiserPassword,

};