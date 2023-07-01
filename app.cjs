require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook");
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        User.find({secret:{$exists:true}}).then((foundUser) => {
            res.render("secrets", {usersWithSecrets: foundUser});
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect("/secrets");
    }
);

app.get("/auth/facebook",
    passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect("/secrets");
    }
);

app.post("/submit", (req, res) => {
    const userSecret = req.body.secret;
    User.findById(req.user.id).then((foundUser) => {
        foundUser.secret = userSecret;
        foundUser.save();
        res.redirect("/secrets");
    });
});

app.post("/register", (req, res) => {
    User.register({ username: req.body.username, active: false }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            req.login(user, (err) => {
                if (err) { res.redirect("/register"); }
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login",
    passport.authenticate("local", { failureRedirect: "/login" }),
    function (req, res) {
        res.redirect("/secrets");
    }
);

app.listen(3000, () => {
    console.log("Server is running at port 3000");
});