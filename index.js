const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to mongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  exercises: [{
    type: Schema.Types.ObjectId,
    ref: "Exercise"
  }]
});

mongoose.exports = mongoose.model("User", userSchema);

// Create exercise schema
const exerciseSchema = new mongoose.Schema({
  username: {
    type: Schema.Types.ObjectId,
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
    required: true,
  },
  _id: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

mongoose.exports = mongoose.model("Exercise", userSchema);

// Check if mongoose is connected
console.log(mongoose.connection.readyState);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
