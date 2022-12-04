const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to mongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create exercise schema
const exerciseSchema = new mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
  },
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
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
app.post("/api/users/:_id/exercises", (req, res) => {
  
  
  res.json({})
})


// Export mongoose
exports.UserModel = User
exports.ExerciseModel = Exercise

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
