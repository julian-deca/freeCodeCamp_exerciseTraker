const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.static("public"));

const userSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

app.post("/api/users/", (req, res) => {
  const username = req.body.username;
  console.log(username);
  new User({
    username: username,
  });

  res.json({ g: username });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
