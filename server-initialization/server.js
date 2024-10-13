// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
//const fetch = require('node-fetch'); // For geocoding

// Initialize the Express application
const app = express();

// Configure middleware for parsing URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session management with a secret key
app.use(
  session({
    secret: 'your_secret_key', // Replace with a secure key in production
    resave: false,
    saveUninitialized: true,
  })
);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Initialize an empty array to store user data
let users = [];

// Load existing users from 'data.json' if the file exists
if (fs.existsSync('data.json')) {
  const data = fs.readFileSync('data.json');
  users = JSON.parse(data);
}

// Function to save the current state of users to 'data.json'
function saveUsers() {
  fs.writeFileSync('data.json', JSON.stringify(users, null, 2));
}

// Function to calculate the distance between two geographic coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert degrees to radians
  function toRad(Value) {
    return (Value * Math.PI) / 180;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

// Route to handle user registration
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists in the user database
  if (users.find((user) => user.username === username)) {
    return res.send('User already exists. Please choose a different username.');
  }

  // Add the new user to the user database with an empty profile
  users.push({
    username,
    password,
    profile: {
      fullName: '',
      location: '',
      latitude: null,
      longitude: null,
      skillsOffered: '',
      skillsWanted: '',
      availability: '',
      contactPreference: '',
      bio: '',
    },
  });

  // Save the updated user database to 'data.json'
  saveUsers();

  // Redirect the user to the login page after successful registration
  res.redirect('/login.html');
});

// Route to handle user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authenticate the user by checking the username and password
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    // If authentication is successful, store the user information in the session
    req.session.user = user;
    res.redirect('/dashboard.html');
  } else {
    // If authentication fails, send an error message
    res.send('Invalid credentials. Please try again.');
  }
});

// Route to handle saving or updating a user's profile
app.post('/save-profile', async (req, res) => {
  // Check if the user is authenticated
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

  // Initialize latitude and longitude variables
  let latitude = null;
  let longitude = null;

  try {
    // Geocode the provided location to obtain latitude and longitude
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      latitude = parseFloat(data[0].lat);
      longitude = parseFloat(data[0].lon);
    }
  } catch (error) {
    // Log any errors that occur during the geocoding process
    console.error('Error geocoding location:', error);
  }

  // Update the user's profile with the provided information and geocoded coordinates
  users = users.map((user) => {
    if (user.username === req.session.user.username) {
      user.profile = {
        fullName,
        location,
        latitude,
        longitude,
        skillsOffered,
        skillsWanted,
        availability,
        contactPreference,
        bio,
      };
      req.session.user = user; // Update the session data with the new profile
    }
    return user;
  });

  // Save the updated user database to 'data.json'
  saveUsers();

  // Redirect the user back to the dashboard with a success query parameter
  res.redirect('/dashboard.html?saved=true');
});

// Route to retrieve session data for the currently logged-in user
app.get('/session-data', (req, res) => {
  if (req.session.user) {
    // Exclude the password from the user data before sending
    const { password, ...userData } = req.session.user;
    res.json({ user: userData });
  } else {
    // If no user is logged in, send null
    res.json({ user: null });
  }
});

// Route to retrieve profiles of nearby users within a 5 km radius
app.get('/profiles', (req, res) => {
  // Redirect to login if the user is not authenticated
  if (!req.session.user) {
    return res.redirect('/login.html');
  }

  const { lat, lon } = req.query;

  // Ensure that latitude and longitude are provided
  if (!lat || !lon) {
    return res.status(400).send('Latitude and longitude are required.');
  }

  const currentUser = req.session.user;

  const currentLatitude = parseFloat(lat);
  const currentLongitude = parseFloat(lon);

  // Filter users to find those within a 5 km radius, excluding the current user
  const nearbyUsers = users
    .filter((user) => {
      if (user.username === currentUser.username) return false;

      if (
        user.profile &&
        user.profile.latitude !== null &&
        user.profile.longitude !== null
      ) {
        const distance = calculateDistance(
          currentLatitude,
          currentLongitude,
          user.profile.latitude,
          user.profile.longitude
        );
        return distance <= 5; // Include users within 5 km
      }
      return false;
    })
    .map((user) => {
      // Exclude sensitive information like the password
      const { password, ...safeUser } = user;
      return safeUser;
    });

  // Send the list of nearby profiles as a JSON response
  res.json({ profiles: nearbyUsers });
});

// Route to handle user logout
app.get('/logout', (req, res) => {
  // Destroy the user's session and redirect to the login page
  req.session.destroy();
  res.redirect('/login.html');
});

// Start the Express server on port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
