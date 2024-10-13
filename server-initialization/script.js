// Wait for the DOM to fully load before executing the script
document.addEventListener('DOMContentLoaded', () => {
  // Check if the current page is the dashboard
  if (window.location.pathname.endsWith('/dashboard.html')) {
    // Fetch session data from the server
    fetch('/session-data')
      .then((response) => response.json())
      .then((data) => {
        if (data.user) {
          const user = data.user;
          // Display the username on the dashboard
          const usernameElement = document.getElementById('username');
          if (usernameElement) {
            usernameElement.textContent = user.username;
          }

          // Retrieve URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const saved = urlParams.get('saved');

          if (user.profile && user.profile.fullName) {
            // Populate the profile summary section with user data
            document.getElementById('summary-fullName').textContent = user.profile.fullName;
            document.getElementById('summary-location').textContent = user.profile.location;
            document.getElementById('summary-skillsOffered').textContent = user.profile.skillsOffered;
            document.getElementById('summary-skillsWanted').textContent = user.profile.skillsWanted;
            document.getElementById('summary-availability').textContent = user.profile.availability;
            document.getElementById('summary-contactPreference').textContent = user.profile.contactPreference;
            document.getElementById('summary-bio').textContent = user.profile.bio;

            // Show the profile summary and hide the profile form
            const profileSummary = document.getElementById('profile-summary');
            const profileForm = document.getElementById('profile-form');
            if (profileSummary && profileForm) {
              profileSummary.style.display = 'block';
              profileForm.style.display = 'none';
            }

            // Display a success message if the profile was just saved
            if (saved === 'true') {
              const successMessage = document.getElementById('success-message');
              if (successMessage) {
                successMessage.style.display = 'block';
              }
            }
          } else {
            // Show the profile form and hide the profile summary if no profile exists
            const profileForm = document.getElementById('profile-form');
            const profileSummary = document.getElementById('profile-summary');
            if (profileForm && profileSummary) {
              profileForm.style.display = 'block';
              profileSummary.style.display = 'none';
            }

            // Populate the form fields with existing profile data if available
            if (user.profile) {
              document.getElementById('fullName').value = user.profile.fullName || '';
              document.getElementById('location').value = user.profile.location || '';
              document.getElementById('skillsOffered').value = user.profile.skillsOffered || '';
              document.getElementById('skillsWanted').value = user.profile.skillsWanted || '';
              document.getElementById('availability').value = user.profile.availability || '';
              document.getElementById('contactPreference').value = user.profile.contactPreference || '';
              document.getElementById('bio').value = user.profile.bio || '';
            }
          }

          // Add a click event listener to the edit profile button
          const editButton = document.getElementById('edit-profile-button');
          if (editButton) {
            editButton.addEventListener('click', () => {
              const profileForm = document.getElementById('profile-form');
              const profileSummary = document.getElementById('profile-summary');
              const successMessage = document.getElementById('success-message');

              // Show the profile form and hide the profile summary
              if (profileForm && profileSummary) {
                profileForm.style.display = 'block';
                profileSummary.style.display = 'none';
              }

              // Hide the success message when editing the profile
              if (successMessage) {
                successMessage.style.display = 'none';
              }

              // Populate the form fields with the current profile data
              document.getElementById('fullName').value = user.profile.fullName || '';
              document.getElementById('location').value = user.profile.location || '';
              document.getElementById('skillsOffered').value = user.profile.skillsOffered || '';
              document.getElementById('skillsWanted').value = user.profile.skillsWanted || '';
              document.getElementById('availability').value = user.profile.availability || '';
              document.getElementById('contactPreference').value = user.profile.contactPreference || '';
              document.getElementById('bio').value = user.profile.bio || '';
            });
          }
        } else {
          // Redirect to the login page if the user is not logged in
          window.location.href = '/login.html';
        }
      })
      .catch((error) => console.error('Error fetching session data:', error));
  }

  // Check if the current page is the profiles page
  if (window.location.pathname.endsWith('/profiles.html')) {
    // Function to initialize the Leaflet map with given coordinates
    function initializeMap(currentLat, currentLon) {
      // Create a new Leaflet map centered at the user's location
      const map = L.map('map').setView([currentLat, currentLon], 13);

      // Add OpenStreetMap tiles to the map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Define a custom icon for the user's marker
      const userIcon = L.icon({
        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Add a marker for the user's current location
      L.marker([currentLat, currentLon], { icon: userIcon })
        .addTo(map)
        .bindPopup('You are here')
        .openPopup();

      // Fetch nearby profiles based on the user's location
      fetch(`/profiles?lat=${currentLat}&lon=${currentLon}`)
        .then((response) => {
          if (response.redirected) {
            // Redirect to login if the user is not authenticated
            window.location.href = '/login.html';
          } else {
            return response.json();
          }
        })
        .then((data) => {
          if (data && data.profiles) {
            const profilesList = document.getElementById('profiles-list');
            if (profilesList) {
              if (data.profiles.length === 0) {
                // Display a message if no profiles are found
                profilesList.innerHTML = '<p>No neighbors found within a 5 km radius.</p>';
              } else {
                // Iterate through each profile and create profile cards and markers
                data.profiles.forEach((user) => {
                  const profileCard = document.createElement('div');
                  profileCard.className = 'profile-card';

                  // Populate the profile card with user information
                  profileCard.innerHTML = `
                    <h3>${user.profile.fullName}</h3>
                    <p><strong>Location:</strong> ${user.profile.location}</p>
                    <p><strong>Skills Offered:</strong> ${user.profile.skillsOffered}</p>
                    <p><strong>Skills Wanted:</strong> ${user.profile.skillsWanted}</p>
                    <p><strong>Availability:</strong> ${user.profile.availability}</p>
                    <p><strong>Contact Preference:</strong> ${user.profile.contactPreference}</p>
                    <p><strong>Bio:</strong> ${user.profile.bio}</p>
                  `;

                  // Add the profile card to the profiles list
                  profilesList.appendChild(profileCard);

                  // Add a marker on the map for the nearby user
                  const marker = L.marker([user.profile.latitude, user.profile.longitude])
                    .addTo(map)
                    .bindPopup(
                      `<strong>${user.profile.fullName}</strong><br>${user.profile.skillsOffered}`
                    );
                });
              }
            }
          } else {
            console.error('No profiles data received.');
          }
        })
        .catch((error) => console.error('Error fetching profiles:', error));
    }

    // Check if the browser supports geolocation
    if (navigator.geolocation) {
      // Attempt to get the user's current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;
          initializeMap(currentLat, currentLon);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default coordinates if location access fails
          alert('Unable to access your location. Using default location.');
          const currentLat = 43.6055; // Latitude of 50 Bristol Rd W, Mississauga, ON
          const currentLon = -79.6968; // Longitude of 50 Bristol Rd W, Mississauga, ON
          initializeMap(currentLat, currentLon);
        }
      );
    } else {
      // Use default coordinates if geolocation is not supported
      alert('Geolocation is not supported by your browser. Using default location.');
      const currentLat = 43.6055; // Latitude of 50 Bristol Rd W, Mississauga, ON
      const currentLon = -79.6968; // Longitude of 50 Bristol Rd W, Mississauga, ON
      initializeMap(currentLat, currentLon);
    }
  }

});
