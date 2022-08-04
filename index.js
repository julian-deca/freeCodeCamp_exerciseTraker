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
  count: 0,
  log: [{}],
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
  }).save((err, data) => {
    if (err) console.error("error", err);
    res.json({ username: data.username, _id: data._id });
  });
});
app.get("/api/users", (req, res) => {
  User.find({ username: /.*/g })
    .select("username")
    .exec((err, data) => {
      if (err) console.error("error", err);
      console.log(data);
      res.json(data);
    });
});
app.post("/api/users/:id/exercises", (req, res) => {
  const description = req.body.description;
  const duration = req.body.duration;
  console.log(req.body.date);
  let date;
  if (req.body.date == "" || req.body.date == undefined) {
    date = new Date();
  } else {
    date = new Date(req.body.date);
    date.setDate(date.getDate() + 1);
  }

  date = date.toDateString();
  const id = req.params.id;
  const exercise = {
    description: description,
    duration: Number(duration),
    date: date,
  };
  User.findOneAndUpdate(
    { _id: id },
    { $push: { log: exercise }, $inc: { count: +1 } },
    { new: true }
  ).exec((err, data) => {
    if (err) console.error("error", err);
    res.json({
      _id: data._id,
      username: data.username,
      date: date,
      duration: duration,
      description: description,
    });
  });
});
app.get("/api/users/:id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params.id;

  User.findById({ _id: id })
    .select("-__v")
    .exec((err, data) => {
      if (err) console.error("error", err);
      let logs = data.log;
      let filteredLogs = logs.filter((log) => {
        const logDate = new Date(log.date).getTime();
        const toMS = new Date(to).getTime();
        const fromMS = new Date(from).getTime();

        console.log(log.date);
        return logDate > fromMS && logDate < toMS;
      });
      console.log(filteredLogs);
      res.json(data);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
