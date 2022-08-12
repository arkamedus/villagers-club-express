import UserController from "./controller/UserController";
import {isAuthenticated, serializeUserInternal} from "./util/Auth";
import {MongoDriver, ObjectID} from "./util/MongoDriver";
import ItemsController from "./controller/ItemsController";
import {ItemCatalog} from "./util/ItemCatalog";
import {VillagerCatalog} from "./util/VillagerCatalog";
import VillagersController from "./controller/VillagersController";
import SearchController from "./controller/SearchController";
import {generatePageTitle} from "./util/Text";
import ForumsController from "./controller/ForumsController";
export const ejs = require('ejs');
import {ejsHelpers} from "./util/EJSHelpers";
import SetsController from "./controller/SetsController";
import {ReactionCatalog} from "./util/ReactionCatalog";
import ReactionsController from "./controller/ReactionsController";
import UserListApiController from "./controller/UserListApiController";
import TradesController from "./controller/TradesController";
import OpenGraphController from "./controller/OpenGraphController";
import AnalyticsController from "./controller/AnalyticsController";
import EmailController from "./controller/EmailController";
import BlogController from "./controller/BlogController";

export let flash = require('express-flash');

export const itemCatalog = new ItemCatalog();
export const reactionCatalog = new ReactionCatalog();
export const villagerCatalog = new VillagerCatalog(reactionCatalog, itemCatalog);

let sources = [];
itemCatalog.getItems().forEach(function (item) {
    if (item.sourceSheet) {
        if (sources.indexOf(item.sourceSheet) == -1) {
            sources.push(item.sourceSheet);
        }
    }
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const mongo_uri = process.env.mongoUri;
const dbName = process.env.mongoDatabase;

export const db = new MongoDriver(mongo_uri, dbName);

const PORT = parseInt(process.env.PORT) | 80;

const app = express();
app.set('views', __dirname + '/view');
app.set('view engine', 'ejs');
app.use(express.static('dist'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('cookie-session')({secret: process.env.sessionSecret, resave: true, saveUninitialized: true}));
app.use(flash());
passport.serializeUser(serializeUserInternal);

passport.deserializeUser(function (obj, cb) {

    // Convert User Session Object into Internal User Object
    obj._id = ObjectID(obj._id);
    cb(null, obj);
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.googleClientId,
            clientSecret: process.env.googleClientSecret,
            callbackURL: process.env.googleCallbackUrl
        },
        (accessToken, refreshToken, profile, cb) => {
            return cb(null, profile);
        }
    )
);

app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    res.locals.environment = process.env.environment||"development";
    res.locals.helpers=ejsHelpers;
    next();
});


app.get('/',
    function (req, res) {
        res.render('home', {
            user: req.user,
            search: "",
            meta_url:"https://villagers.club",
            description:"The world's largest and most up-to-date Animal Crossing: New Horizons Villagers, Clothing, and Furniture Community Website.",
            title: 'VillagersClub - Animal Crossing New Horizons Items & Villagers',
            canonical: '',
            noindex: false
        });
    });

app.get('/login',
    function (req, res) {
        res.render('login', {
            user: req.user,
            search: "",
            title: generatePageTitle('Login & Sign Up'),
            canonical: '/login',
            noindex: false
        });
    });

app.get('/locked',
    function (req, res) {
        res.render('locked', {
            user: req.user, search: "", title: generatePageTitle('Locked Content'),
            canonical: '/locked',
            noindex: true
        });
    });

app.get('/privacy',
    function (req, res) {
        res.render('privacy', {
            user: req.user, search: "", title: generatePageTitle('Privacy Policy'),
            canonical: '/privacy',
            noindex: false
        });
    });

app.get('/ads',
    function (req, res) {
        res.render('ads', {
            user: req.user, search: "", title: generatePageTitle('Advertising Disclaimer'),
            canonical: '/ads',
            noindex: true
        });
    });

app.get('/login/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

app.get('/auth/g/callback',
    passport.authenticate('google', {failureRedirect: '/login'}),
    function (req, res) {
        res.redirect('/profile');
    });

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/members', isAuthenticated,
    function (req, res) {
        res.send('MEMBERS AREA');
    });

[UserController, ItemsController, VillagersController, SearchController, SetsController, ReactionsController, UserListApiController, TradesController, OpenGraphController, AnalyticsController, BlogController/*, EmailController, ForumsController*/].forEach(controller => {
    const instance = new controller(app);
});

app.get('*', function (req, res) {
    res.status(404).render('error', {
        user: req.user, search: "", title: generatePageTitle('Error'), canonical: false,
        noindex: true
    });
});


app.listen(PORT, () => {
    console.log(`App up on port ${PORT}`);
});