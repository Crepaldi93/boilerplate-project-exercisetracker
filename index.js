const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { response } = require('express');

// Connect to mongoDB
mongoose.connect("mongodb+srv://crepaldi93:senha123@exercise-tracker.2manwpr.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

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

  // Clear database if username "delete_user_database" is provided
  if (htmlUser === "delete_user_database") {
    User.deleteMany({}, (err, data) => {
      if (err) return console.error(err);
      return res.json(data)
    });
  }
  
  User.findOne({username: htmlUser}, (err, oldUser) => {
    if (err) return console.error(err);

    if (!oldUser) {
      // Insert htmlUser into mongodb
      let newUser = new User({username: htmlUser});
      newUser.save((err2, savedUser) => {
        if (err2) return console.error(err2);
        return res.json({
          username: savedUser.username,
          _id: savedUser.id
        })
      });
    } else {
      return res.json({
        username: oldUser.username,
        _id: oldUser.id
      });
    }
  });
});

// Get all users
app.get("/api/users", (req, res) => {
  User.find({}, (err, usersArray) => {
    if (err) return console.error(err);

    let formattedArray = [];

    for (item in usersArray) {
      formattedArray.push({
        _id: usersArray[item]._id,
        username: usersArray[item].username
      })
    }
    res.json(formattedArray);
  })
})

// Post new exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  let myId = req.params._id;
  let myDescription = req.body.description;
  let myDuration = parseInt(req.body.duration);
  let myDate = req.body.date;

  if (!myDate) {
    myDate = new Date().toISOString();
  } else if (myDate.match(/^\d{4}-\d{2}-\d{2}/)) {
    myDate = myDate.replace(/-/g, "/").substring();
    myDate = new Date(myDate).toISOString();
  } else {
    return res.json({error: "Invalid Date Format"})
  }

  myDate = myDate.replace(/-/g, "/");
  myDate = myDate.substring(0, myDate.indexOf("T"));

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

      let formattedDate = new Date(newExercise.date).toDateString();

      return res.json({
        _id: updatedUser.id,
        username: updatedUser.username,
        date: formattedDate,
        duration: newExercise.duration,
        description: newExercise.description
      });
    }
  );
});

// Get exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  let id = req.params._id

  User.findById(id, (err, data) => {
    if (err) return console.error(err);

    let newLog = []

    for (item in data.log) {
      newLog.push({
        description: data.log[item].description,
        duration: data.log[item].duration,
        date: data.log[item].date
      });
    }

    // Filter time
    if (req.query.from || req.query.to) {
      let firstDate = new Date(0);
      let lastDate = new Date();

      if (req.query.from) {
        firstDate = new Date(req.query.from);
      }

      if (req.query.to) {
        lastDate = new Date(req.query.to);
      }

      firstDate = firstDate.getTime();
      lastDate = lastDate.getTime();
      
      newLog = newLog.filter((session) => {
        let sessionDate = new Date(session.date).getTime();
        return sessionDate >= firstDate && sessionDate <= lastDate
      })
    }

    for (item in newLog) {
      newLog[item].date = new Date(newLog[item].date).toDateString();
    }
    
    if (req.query.limit) {
      newLog = newLog.slice(0, req.query.limit);
    }
    
    return res.json({
      _id: data.id,
      username: data.username,
      count: newLog.length,
      log: newLog
    }) 
  });
});



// Export mongoose
exports.UserModel = User
exports.ExerciseModel = Exercise

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
