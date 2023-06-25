require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds).then((hash) => {
        const user = new User({
            username: req.body.username,
            password: hash
        });
        user.save().then(() => {
            res.render("secrets");
        }).catch((err) => { res.send(err) });
    });
});

app.post("/login", (req, res) => {
    User.findOne({ username: req.body.username }).then((foundUsername) => {
        if (foundUsername) {
            bcrypt.compare(req.body.password, foundUsername.password).then((result) => {
                if (result === true) {
                    res.render("secrets");
                } else {
                    res.send("Wrong Password");
                }
            });
        }else{
            res.send("Wrong User-name");
        }
    }).catch((err) => { console.log(err); });
});

app.listen(3000, () => {
    console.log("Server is running at port 3000");
});