import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import {router} from './routes/router.mjs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit'




dotenv.config();
const app = express();
app.set('trust proxy', 1);
app.use(helmet());

app.use(express.static("public"));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());


app.use(session({

    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
       maxAge: 1000 * 60 * 60, // 1 hour
       httpOnly: true,
       secure: true         // Use true if you are serving over HTTPS
    }
}));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});


app.use(limiter);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.role = req.session.role;
  next();
});

app.locals.navLinks = [
    { title: "Εκδηλώσεις", url: "/events?category=Εκδηλώσεις" },
    { title: "Θέατρο", url: "/events?category=Θέατρο" },
    { title: "Μουσική", url: "/events?category=Μουσική" },
    { title: "Αθλητικά", url: "/events?category=Αθλητικά" },
    { title: "Σινεμά", url: "/events?category=Σινεμά" }
];


// Configure Express-Handlebars
app.engine('.hbs', engine({ 
    extname: '.hbs', 
    defaultLayout: 'main', 
    layoutsDir: './view/layouts', 
    partialsDir: ['./view/partials'],
    helpers: {
         eq: (a, b) => a === b,
         json: (context) => JSON.stringify(context),
         inc: (value) => parseInt(value) + 1,
    }

}));
app.set('view engine', 'hbs');
app.set('views', './view');




// Use routes

app.use('/', router);
app.use((err, req, res, next) => {

   res.status(500).render('error', { message: err, layout: false });
});


export {app}