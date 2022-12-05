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
  userId: {
    type: String,
    required: true
  },
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
  }
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
  let thisId = req.params._id;
  let thisDescription = req.body.description;
  let thisDuration = parseInt(req.body.duration);
  let thisDate

  if (!req.body.date) {
    thisDate = (new Date()).toDateString();
  } else if (new Date(req.body.date) == "Invalid Date") {
    return res.json({error: "invalid date"})
  } else {
    thisDate = (new Date(req.body.date)).toDateString();
  }

  User.findById(thisId, (err, user) => {
    if (err) return console.error(err);
    if (user !== null) {
      let newExercise = new Exercise({
        userId: thisId,
        description: thisDescription,
        duration: thisDuration,
        date: thisDate
      });
      newExercise.save( (err2, exercise) => {
        if (err2) return console.error(err2);
        return res.json({
          id: user._id,
          username: user.username,
          date: exercise.date,
          duration: exercise.duration,
          description: exercise.description  
        });
      });
    } else {
      return res.json({error: "user not found"})
    }
  });
});



// Export mongoose
exports.UserModel = User
exports.ExerciseModel = Exercise

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
