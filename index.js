const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { response } = require('express');

// Connect to mongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

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
    type: Date
  }
});

// Create exercise model
const Exercise = mongoose.model("Exercise", exerciseSchema);

// Create user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
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
app.post("/api/users/:_id?/exercises", (req, res) => {
  //Insert new exercise into the database
  let newExercise = new Exercise({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  });

  // Check if date is an empty string
  if (!newExercise.date) {
    newExercise.date = new Date().toISOString().substring(0,10);
  }

  console.log(req.body);
  if (!req.body[":_id"]) {
    res.json({error: "no id provided"})
  }
  // Add info to user log
  User.findByIdAndUpdate(
    req.body[":_id"],
    {$push: {log: newExercise}},
    {returnDocument: "after"},
    (err, updatedUser) => {
      if (err) return console.error(err)
      let responseObject = {}
      responseObject["_id"] = req.body[":_id"];
      responseObject["username"] = updatedUser.username;
      responseObject["date"] = new Date(newExercise.date).toDateString();
      responseObject["duration"] = newExercise.duration;
      responseObject["description"] = newExercise.description;
      res.json(responseObject);
    }
  );
});


// Export mongoose
exports.UserModel = User
exports.ExerciseModel = Exercise

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
