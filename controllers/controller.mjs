import Database from 'better-sqlite3';
const db = new Database('model/db.sqlite');
import * as model from '../model/sqlite/model.mjs';

async function home(req, res) {
    const events = model.getPopularEvents();
    const sliderEvents = model.getSliderEvents();
    
    res.render('index', { 
        pageTitle: 'Book.com- Buy Tickets Online',
        year: '2025',
        events,
        sliderEvents
    });
}

async function dashboard(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const user = req.session.user;
  if (user.role === 'organiser') {
    // Load organiser-specific dashboard data.
    const organiserId = user.id;
    const events = model.getEventsByOrganiserId(organiserId);
    return res.render('organiser_dashboard', { 
        pageTitle: 'Dashboard',
        events 
    });
  } else {
    // Load general user dashboard data.
    const userId = user.id;
    let tickets = [];
    if (userId) {
      const stmt = db.prepare(`
        SELECT t.id AS ticket_id, t.status, t.row_index, t.number_index, e.title, e.dates
        FROM ticket_logs tl
        JOIN tickets t ON tl.ticket_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE tl.user_id = ?
        ORDER BY e.dates DESC
      `);
      tickets = stmt.all(userId);
    }
    return res.render('user_dashboard', { 
      pageTitle: 'Dashboard', 
      user: user.name || user.email,
      tickets,
      isDashboard: true 
    });
  }
}


async function event_stats(req, res) {
    res.render('event_stats', { pageTitle: 'Στατιστικά Εκδήλωσης - Ticket Service' });
}

async function events(req, res) {
    const selectedCategory = req.query.category || 'Default';
    let events = [];

    if (['Θέατρο', 'Μουσική', 'Αθλητικά', 'Σινεμά', 'Εκδηλώσεις'].includes(selectedCategory)) {
        events = model.getEventsByCategory(selectedCategory);
    }

    res.render('event_page', { selectedCategory, events });
}

async function event_info(req, res) {
    const eventId = req.params.id;
    try {
        const eventStmt = db.prepare(`
            SELECT e.id, e.dates, e.title, e.description, e.image, e.category,
                   o.name AS organizer, o.phone AS organizerPhone,
                   s.location AS place, s.id AS space_id
            FROM events e
            JOIN organizers o ON e.organizer_id = o.AFM
            JOIN spaces s ON e.space_id = s.id
            WHERE e.id = ?
            LIMIT 1
        `);
        const event = eventStmt.get(eventId);
        if (!event) return res.status(404).send("Event not found");


const seatsStmt = db.prepare(`
  SELECT s.row, s.number,
         COALESCE(t.status, 'available') AS status,
         (CASE 
             WHEN s.row <= 3 THEN 'ZoneA'
             WHEN s.row <= 6 THEN 'ZoneB'
             ELSE 'ZoneC'
          END) as zone
  FROM seats s
  LEFT JOIN tickets t
    ON s.event_id = t.event_id
    AND s.row = t.row_index
    AND s.number = t.number_index
  WHERE s.event_id = ?
`);
       
const allSeatsRaw = seatsStmt.all(eventId).map(seat => ({
    row: parseInt(seat.row),
    number: parseInt(seat.number),
    status: seat.status,
    zone: seat.zone || (parseInt(seat.row) <= 3 ? "ZoneA" : (parseInt(seat.row) <= 6 ? "ZoneB" : "ZoneC"))
}));


        const seatGrid = Array.from({ length: 11 }, (_, rowIndex) =>
  Array.from({ length: 15 }, (_, colIndex) => {
    const seat = allSeatsRaw.find(s => s.row === rowIndex + 1 && s.number === colIndex + 1);
    if (!seat) return { status: 'empty', zone: "ZoneA" };
    return {
      status: seat.status,
      zone: seat.zone
    };
  })
);

        const setValueStmt = db.prepare(`
            SELECT zone_name, value
            FROM set_value 
            WHERE event_id = ? AND space_id = ?
        `);
        const setValues = setValueStmt.all(eventId, event.space_id);
        const eventPrice = {};
        setValues.forEach(row => {
            eventPrice[row.zone_name] = row.value;
        });

        const eventImg = event.image
            ? "data:image/png;base64," + event.image.toString("base64")
            : "/images/default_event.png";

        res.render("event_info", {
            pageTitle: event.title,
            eventId: event.id,
            eventImg,
            eventTitle: event.title,
            eventDate: event.dates,
            eventPlace: event.place,
            eventDescription: Array.isArray(event.description)
                ? event.description
                : [event.description],
            eventOrganizer: event.organizer,
            eventPhone: event.organizerPhone,
            eventPrice,
            rows: seatGrid 
        });
    } catch (err) {
       
        res.status(500).send(err.message);
    }
}

async function login(req, res) {
    res.render('login', { pageTitle: 'Σύνδεση' });
}
async function logout(req, res) {
    req.session.destroy(err => {
        if (err) {            
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
}


async function loginUser(req, res) {
    try {
        const email = req.body.email.toLowerCase();
        const password = req.body.password;

        const loginResult = await model.doLogin(email, password);
        if (loginResult && loginResult.id) {
            req.session.user = {
                id: loginResult.id,
                name: loginResult.name,
                role: loginResult.role,
                organiser_id: loginResult.role === 'organiser' ? loginResult.id : undefined
            };
            let redirectTo = req.session.returnTo || '/';
            if (!redirectTo || redirectTo === '/login') {
                redirectTo = '/';
            }
            // Redirect organisers to their dashboard
            if (loginResult.role === 'organiser') {
                redirectTo = '/dashboard';
            }
            delete req.session.returnTo;
            res.redirect(redirectTo);
        } else {
            res.render('login', {
                pageTitle: 'Σύνδεση',
                error: "Λανθασμένα στοιχεία σύνδεσης"
            });
        }
    } catch (err) {

        res.status(500).send(err.message);
    }
}


async function organiser_signup_post(req, res) {
    try {
        const { password, confirm_password, email } = req.body;
        if (password !== confirm_password) {
            return res.render('organiser_signup', {
                pageTitle: 'Organizer Sign Up - Ticket Service',
                error: 'Οι κωδικοί δεν ταιριάζουν'
            });
        }

        const result = await model.registerOrganiser(req.body);
        if (result.result) {
            const loginResult = await model.doLogin(email.toLowerCase(), password);
            if (loginResult && loginResult.id) {
                req.session.user = {
                    id: loginResult.id,
                    name: loginResult.name,
                    role: loginResult.role,
                    organiser_id: loginResult.id
                };
                return res.redirect('/dashboard');
            } else {
                return res.redirect('/login');
            }
        } else {
            res.render('organiser_signup', {
                pageTitle: 'Organizer Sign Up - Ticket Service',
                error: result.message
            });
        }
    } catch (err) {

        throw err;
    }
}

async function set_event(req, res) {
  try {
    const categories = model.getCategories();
    let spaces = model.getSpaces();

    spaces = spaces.map(space => {
      space.zones = model.getZonesForSpace(space.id);
      return space;
    });

    const cities = [...new Set(spaces.map(space => space.location))];

    res.render('set_event', { 
      pageTitle: 'Δημιουργία Εκδήλωσης - Ticket Service',
      categories,
      cities,
      spaces
    });
  } catch(err) {

    throw err;
  }
}

async function newEvent(req, res) {
  try {

    const zonePrices = {
      zoneA: Number(req.body.price_zoneA),
      zoneB: Number(req.body.price_zoneB),
      zoneC: Number(req.body.price_zoneC)
    };

    const eventData = {
      title: req.body.title,
      description: req.body.event_description,
      id: null,
      organizer_id: req.session && req.session.user ? req.session.user.organiser_id : 1,
      space_id: Number(req.body.event_space) || 1,
      dates: req.body.event_date + " " + req.body.event_time,
      image: req.file ? req.file.buffer : null,
      category: req.body.event_category,
      zonePrices 
    };

    const result = await model.newEvent(eventData);
    if (result) {
      return res.redirect('/dashboard');
    } else {
      res.render('set_event', { 
        pageTitle: 'Δημιουργία Εκδήλωσης', 
        error: 'Error creating event'
      });
    }
  } catch (err) {
    
    throw err;
  }
}

async function organiser_dashboard(req, res) {

    const organiserId = req.session.user?.id;
    let events = [];
    if (organiserId) {
        events = model.getEventsByOrganiserId(organiserId);
    }
    res.render('organiser_dashboard', { pageTitle: 'Organiser Dashboard', events });
}

async function payment(req, res) {
    const seatsParam = req.query.seats;
    let seats = [];
    if (seatsParam) {
        seats = seatsParam.split(',').map(pair => {
            const [row, seat] = pair.split('-');
            return { row, seat };
        });
    }

    // Query to get zone pricing for the event (adjust table/column names as needed)
    const setValueStmt = db.prepare(`
         SELECT zone_name, value
         FROM set_value 
         WHERE event_id = ?
    `);
    const setValues = setValueStmt.all(req.query.eventId);
    const eventPrice = {};
    setValues.forEach(row => {
         eventPrice[row.zone_name] = row.value;
    });

    res.render('payment', { seats, seatsParam, eventId: req.query.eventId, eventPrice });
}


async function payment_submit(req, res) {
    try {
        
        const { seats: seatsParam, eventId } = req.body; 
        if (!seatsParam || !eventId) {
            return res.status(400).send("Missing seats or eventId parameter.");
        }

        const seatPairs = seatsParam.split(',').map(pair => {
    const [row, number] = pair.split('-');
    return { row: parseInt(row, 10) , number: parseInt(number, 10)  };
});

        const updateStmt = db.prepare(`
            UPDATE tickets
            SET status = 'sold'
            WHERE event_id = ? AND row_index = ? AND number_index = ?
        `);

        const insertStmt = db.prepare(`
            INSERT INTO tickets (event_id, row_index, number_index, status)
            VALUES (?, ?, ?, 'sold')
        `);
        const logStmt = db.prepare(`
            INSERT  INTO ticket_logs (user_id, ticket_id)
            VALUES (?, ?)
        `);

        for (const seat of seatPairs) {
            const result = updateStmt.run(eventId, seat.row, seat.number);
            let ticketId;
            if (result.changes === 0) {
                const info = insertStmt.run(eventId, seat.row, seat.number);
                ticketId = info.lastInsertRowid;
            } else {
                const ticketStmt = db.prepare(`
                SELECT id FROM tickets WHERE event_id = ? AND row_index = ? AND number_index = ?
            `);
            const ticket = ticketStmt.get(eventId, seat.row, seat.number);
           ticketId = ticket?.id;
            }
            if (ticketId && req.session.user?.id) {
                logStmt.run(req.session.user.id, ticketId);
            }
    }

        res.render('successful', {
            pageTitle: 'Η πληρωμή σας ήταν επιτυχής!',
            message: 'Σας ευχαριστούμε για την αγορά σας. Τα εισιτήριά σας είναι διαθέσιμα στο profile σας.',
            linkURL: '/dashboard',
            linkText: 'Μετάβαση στα εισιτήριά μου'
        });
    } catch (err) {
        
        throw err;
    }
}

async function user_signup(req, res) {
    res.render('user_signup', { pageTitle: 'Εγγραφή Χρήστη' });
}

async function user_signup_post(req, res) {
    try {
        const { first_name, last_name, email, password, confirm_password } = req.body;
        if (password !== confirm_password) {
            return res.render('user_signup', { pageTitle: 'Εγγραφή Χρήστη', error: 'Οι κωδικοί δεν ταιριάζουν' });
        }
        const result = await model.registerUser(first_name, last_name, password, email);
        if (result.result) {
           
            const user = { 
            id: result.id, 
            role: 'user', 
            name: first_name, 
            first_name, 
            last_name, 
            email 
            };
            req.session.user = user;
         
           let redirectTo = req.session.returnTo || '/';
            if (['/login', '/user_signup', '/organiser_signup'].includes(redirectTo)) {
                redirectTo = '/';
            }
            delete req.session.returnTo;
            res.redirect(redirectTo);
        } else {
            res.render('user_signup', { pageTitle: 'Εγγραφή Χρήστη', error: result.message });
        }
    } catch (err) {
        
        throw err;
    }
}

async function organiser_signup(req, res) {
    res.render('organiser_signup', { pageTitle: 'Organizer Sign Up - Ticket Service' });
}

async function searchEvents(req, res) {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) {
        return res.render('event_page', { selectedCategory: 'Αναζήτηση', events: [] });
    }

    const stmt = db.prepare(`
        SELECT e.id, e.title, e.dates AS date, e.image, e.category, s.location AS place, s.name AS space_name
        FROM events e
        JOIN spaces s ON e.space_id = s.id
        WHERE
            LOWER(e.title) LIKE LOWER('%' || ? || '%')
            OR LOWER(e.category) LIKE LOWER('%' || ? || '%')
            OR LOWER(s.location) LIKE LOWER('%' || ? || '%')
            OR LOWER(s.name) LIKE LOWER('%' || ? || '%')
    `);
    const events = stmt.all(query, query, query, query).map(event => {
        if (event.image) {
            event.image = "data:image/png;base64," + event.image.toString("base64");
        } else {
            event.image = "/images/default_event.png";
        }
        return event;
    });

    if (events.length === 1) {
        return res.redirect(`/event/${events[0].id}`);
    }

    res.render('event_page', { selectedCategory: 'Αναζήτηση', events });
}


export function getPopularEvents() {
    const stmt = db.prepare(`
        SELECT e.id, e.title, e.dates AS date, e.image, e.category, s.location AS place
        FROM events e
        JOIN spaces s ON e.space_id = s.id
        LEFT JOIN (
            SELECT event_id, COUNT(*) AS sold_count
            FROM tickets
            WHERE status = 'sold'
            GROUP BY event_id
        ) t ON e.id = t.event_id
        ORDER BY COALESCE(t.sold_count, 0) DESC, e.dates DESC
        LIMIT 4
    `);

    return stmt.all().map(event => {
        if (event.image) {
            event.image = "data:image/png;base64," + event.image.toString("base64");
        } else {
            event.image = "/images/default_event.png";
        }
        return event;
    });
}

export function getRecommendedEvents() {
    const stmt = db.prepare(`
        SELECT e.id, e.title, e.dates AS date, e.image, e.category, s.location AS place
        FROM events e
        JOIN spaces s ON e.space_id = s.id
        ORDER BY RANDOM()
        LIMIT 4
    `);

    return stmt.all().map(event => {
        if (event.image) {
            event.image = "data:image/png;base64," + event.image.toString("base64");
        } else {
            event.image = "/images/default_event.png";
        }
        return event;
    });
}

export function getNewEvents() {
    const stmt = db.prepare(`
        SELECT e.id, e.title, e.dates AS date, e.image, e.category, s.location AS place
        FROM events e
        JOIN spaces s ON e.space_id = s.id
        ORDER BY e.dates DESC
        LIMIT 4
    `);

    return stmt.all().map(event => {
        if (event.image) {
            event.image = "data:image/png;base64," + event.image.toString("base64");
        } else {
            event.image = "/images/default_event.png";
        }
        return event;
    });
}

export function getAllEvents() {
    const stmt = db.prepare(`
        SELECT e.id, e.title, e.dates AS date, e.image, e.category, s.location AS place
        FROM events e
        JOIN spaces s ON e.space_id = s.id
        LIMIT 4
    `);

    return stmt.all().map(event => {
        if (event.image) {
            event.image = "data:image/png;base64," + event.image.toString("base64");
        } else {
            event.image = "/images/default_event.png";
        }
        return event;
    });
}

export function getEventsByCategory(category) {
    const stmt = db.prepare(`
        SELECT e.id, e.title, e.dates AS date, e.image, e.category, s.location AS place
        FROM events e
        JOIN spaces s ON e.space_id = s.id
        WHERE e.category = ?
        ORDER BY e.dates DESC
    `);

    return stmt.all(category).map(event => {
        if (event.image) {
            event.image = "data:image/png;base64," + event.image.toString("base64");
        } else {
            event.image = "/images/default_event.png";
        }
        return event;
    });
}

export async function apiPopularEvents(req, res) {
    res.json(getPopularEvents());
}

export async function apiRecommendedEvents(req, res) {
    res.json(getRecommendedEvents());
}

export async function apiNewEvents(req, res) {
    res.json(getNewEvents());
}

export async function apiEventsByCategory(req, res) {
    const category = req.query.category;
    if (!category) return res.json([]);
    res.json(getEventsByCategory(category));
}
async function change_password(req, res) {
  // Only logged-in users can change their password.
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('change_password', { pageTitle: 'Change Password' });
}

async function post_change_password(req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const { old_password, new_password, confirm_password } = req.body;
    res.locals.user = req.session.user;
    if (new_password !== confirm_password) {
      return res.render('change_password', {
        pageTitle: 'Change Password',
        error: 'New passwords do not match'
      });
    }

    const userId = req.session.user.id;
    if(res.locals.user.role == 'organiser') {
        let user = await model.getOrganiserById(userId);
        if (!user) {
          // Generic error message.
          return res.render('change_password', {
            pageTitle: 'Change Password',
            error: 'An error occurred'
          });
        }
        let passwordMatch = await model.verifyOrganiserPassword(userId, old_password);
        if (!passwordMatch) {
          return res.render('change_password', {
            pageTitle: 'Change Password',
            error: 'Παλιο password λαθος'
          });
        }
        let updateResult = await model.updateOrganiserPassword(userId, new_password);
        if (updateResult) {
          res.render('successful', {
            pageTitle: 'Password Changed Successfully',
            message: 'Το password αλλαξε. ',
            linkURL: '/dashboard',
            linkText: 'Πηγαινε στο profile'
          });
        } else {
          return res.render('change_password', {
            pageTitle: 'Change Password',
            error: 'An error occurred'
          });
        }
    }


    else{
        
    let user = await model.getUserById(userId);
    if (!user) {
      // Generic error message.
      return res.render('change_password', {
        pageTitle: 'Change Password',
        error: 'An error occurred'
      });
    }

    // Compare in plain text (note: not secure for production)
    
    let passwordMatch = await model.verifyUserPassword(userId, old_password);
    if (!passwordMatch) {
      return res.render('change_password', {
        pageTitle: 'Change Password',
        error: 'Old password is incorrect'
      });
    }

    // Update the password with the new plain text value.
    let updateResult = await model.updateUserPassword(userId, new_password);
    if (updateResult) {
      res.render('successful', {
            pageTitle: 'Password Changed Successfully',
            message: 'Your password has been updated. ',
            linkURL: '/dashboard',
            linkText: 'πηγαινε στο profile'
        });
    } else {
      res.render('change_password', {
        pageTitle: 'Change Password',
        error: 'An error occurred'
      });
    }
  } 
}catch (err) {

    throw "An error occurred"
  }
}


export {
    home,
    event_stats,
    events,
    dashboard,
    event_info,
    login,
    loginUser,
    logout,
    set_event,
    newEvent,
    organiser_dashboard,
    payment,
    payment_submit,
    user_signup,
    organiser_signup,
    user_signup_post,
    organiser_signup_post,
    searchEvents,
    post_change_password,
    change_password,
};