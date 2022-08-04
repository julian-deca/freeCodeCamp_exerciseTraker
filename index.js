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

const exSchema = new mongoose.Schema({
  date: String,
  duration: Number,
  description: String,
});
const Exercise = mongoose.model("Exercise", exSchema);

const userSchema = new mongoose.Schema({
  username: String,
  count: 0,
  log: [exSchema],
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

      res.json(data);
    });
});
app.post("/api/users/:id/exercises", (req, res) => {
  const description = req.body.description;
  const duration = req.body.duration;

  let date;
  if (req.body.date == "" || req.body.date == undefined) {
    date = new Date();
  } else {
    date = new Date(req.body.date);
    date.setDate(date.getDate() + 1);
  }

  date = date.toDateString();
  const id = req.params.id;
  const exercise = new Exercise({
    date: date,
    duration: Number(duration),
    description: description,
  });
  User.findOneAndUpdate(
    { _id: id },
    { $push: { log: exercise }, $inc: { count: +1 } },
    { new: true }
  ).exec((err, data) => {
    if (err) console.error("error", err);
    res.json({
      _id: data._id,
      username: data.username,
      date: exercise.date,
      duration: exercise.duration,
      description: exercise.description,
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
      let filteredLogs;
      if (to == undefined || from == undefined) {
        filteredLogs = logs;
      } else {
        filteredLogs = logs.filter((log) => {
          const logDate = new Date(log.date).getTime();
          const toMS = new Date(to).getTime();
          const fromMS = new Date(from).getTime();

          return logDate > fromMS && logDate < toMS;
        });
      }
      if (limit != undefined) {
        filteredLogs = filteredLogs.slice(0, limit);
      }
      res.json({
        _id: id,
        username: data.username,
        count: data.count,
        log: filteredLogs,
      });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
