// server.js

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();

// Middleware setup (ensure the order is correct)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'your_secret_key', // Replace with a secure key in production
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static('public')); // Serve static files after setting up body-parser and session

// Simple user database
let users = [];

// Load users from data.json if it exists
if (fs.existsSync('data.json')) {
  const data = fs.readFileSync('data.json');
  users = JSON.parse(data);
}

// Routes

// Registration Route
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  if (users.find((user) => user.username === username)) {
    return res.send('User already exists. Please choose a different username.');
  }

  // Add user to the database with empty profile
  users.push({
    username,
    password,
    profile: {
      fullName: '',
      location: '',
      skillsOffered: '',
      skillsWanted: '',
      availability: '',
      contactPreference: '',
      bio: '',
    },
  });

  // Save users to data.json
  fs.writeFileSync('data.json', JSON.stringify(users));

  res.redirect('/login.html');
});

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authenticate user
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    req.session.user = user;
    res.redirect('/dashboard.html');
  } else {
    res.send('Invalid credentials. Please try again.');
  }
});

// Save Profile Route
app.post('/save-profile', (req, res) => {
  console.log('POST /save-profile route hit');

  if (!req.session.user) {
    return res.redirect('/login.html');
  }

  const {
    fullName,
    location,
    skillsOffered,
    skillsWanted,
    availability,
    contactPreference,
    bio,
  } = req.body;

  // Update user's profile
  users = users.map((user) => {
    if (user.username === req.session.user.username) {
      user.profile = {
        fullName,
        location,
        skillsOffered,
        skillsWanted,
        availability,
        contactPreference,
        bio,
      };
      req.session.user = user; // Update session data
    }
    return user;
  });

  // Save updated users to data.json
  fs.writeFileSync('data.json', JSON.stringify(users));

  // Redirect to dashboard with success query parameter
  res.redirect('/dashboard.html?saved=true');
});

// Session Data Route
app.get('/session-data', (req, res) => {
  if (req.session.user) {
    // Exclude password before sending
    const { password, ...userData } = req.session.user;
    res.json({ user: userData });
  } else {
    res.json({ user: null });
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
