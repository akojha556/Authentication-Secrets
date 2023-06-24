require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

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
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    user.save().then(() => {
        res.render("secrets");
    }).catch((err) => {res.send(err)});
});

app.post("/login", (req, res) => {
    User.findOne({username: req.body.username}).then((foundUsername) => {
        if(foundUsername.password === req.body.password){
            res.render("secrets");
        }else{
            res.send("Wrong password, Try again.");
        }
    })
})

app.listen(3000, () => {
    console.log("Server is running at port 3000");
});