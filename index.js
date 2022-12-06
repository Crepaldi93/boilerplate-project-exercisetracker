const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { response } = require('express');

// Connect to mongoDB
mongoose.connect("mongodb+srv://crepaldi93:senha123@exercise-tracker.tvmlgb6.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

// Create exercise schema
const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String
  }
});

// Create exercise model
const Exercise = mongoose.model("Exercise", exerciseSchema);

// Create user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  log: [exerciseSchema]
});

// Create user model
const User = mongoose.model("User", userSchema);


// Check if mongoose is connected
console.log(mongoose.connection.readyState);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Use body-parser
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

// Post new user
app.post("/api/users", (req, res) => {
  // Get user input from the html page
  let htmlUser = req.body.username;

  // Insert htmlUser into mongodb
  let newUser = new User({username: htmlUser});
  newUser.save((err, savedUser) => {
    if (err) return console.error(err);
    let responseObject = {};
    responseObject["username"] = savedUser.username;
    responseObject["_id"] = savedUser.id;
    res.json(responseObject)
  });
});

// Get all users
app.get("/api/users", (req, res) => {
  User.find({}, (err, usersArray) => {
    if (err) return console.error(err);
    res.json(usersArray);
  })
})

// Post new exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  let myId = req.params._id;
  let myDescription = req.body.description;
  let myDuration = parseInt(req.body.duration);
  let myDate = req.body.date;

  if (!myDate) {
    myDate = new Date().toDateString();
  } else if (new Date(myDate) == 'Invalid Date') {
    return res.json({error: 'Date is invalid'});
  } else {
    myDate = myDate.replace(/-/g, '\/')
    myDate = new Date(myDate).toDateString();
  }

  if (!myId) {
    return res.json({error: "No id provided"});
  }

  if (!myDescription) {
    return res.json({error: "No description provided"});
  }

  if (isNaN(myDuration)) {
    return res.json ({error: "Invalid duration"})
  }

  let newExercise = new Exercise({
    description: myDescription,
    duration: myDuration,
    date: myDate
  });

  User.findByIdAndUpdate(
    myId,
    {$push: {log: newExercise}},
    {recent: true},
    (err, updatedUser) => {
      if (err) return console.error(err);
      return res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        date: newExercise.date,
        duration: newExercise.duration,
        description: newExercise.description
      });
    }
  );
});

// Get full exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  let id = req.params._id

  User.findById(id, (err, data) => {
    if (err) return console.error(err);
    return res.json({
      _id: data._id,
      username: data.username,
      count: data.log.length,
      log: data.log
    });
  });
});

// Export mongoose
exports.UserModel = User
exports.ExerciseModel = Exercise

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
