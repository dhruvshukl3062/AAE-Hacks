// public/script.js

// Testimonial Carousel Functionality

// Check if the carousel exists on the page
const carouselExists = document.querySelector('.testimonial-carousel');
if (carouselExists) {
  let currentSlide = 0;
  const testimonials = document.querySelectorAll('.testimonial');
  const totalSlides = testimonials.length;
  const prevButton = document.querySelector('.prev');
  const nextButton = document.querySelector('.next');

  function showSlide(index) {
    testimonials.forEach((testimonial) => {
      testimonial.classList.remove('active');
    });
    testimonials[index].classList.add('active');
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(currentSlide);
  }

  // Add event listeners only if buttons exist
  if (nextButton && prevButton) {
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);
  }

  // Auto-play the carousel every 5 seconds
  setInterval(nextSlide, 5000);

  // Initial display
  showSlide(currentSlide);
}

// Dashboard Functionality

// Wait for the DOM to load before executing
document.addEventListener('DOMContentLoaded', () => {
  // Fetch user data to display on the dashboard
  fetch('/session-data')
    .then((response) => response.json())
    .then((data) => {
      if (data.user) {
        const user = data.user;
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
          usernameElement.textContent = user.username;
        }

        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const saved = urlParams.get('saved');

        if (user.profile && user.profile.fullName) {
          // Populate profile summary
          document.getElementById('summary-fullName').textContent = user.profile.fullName;
          document.getElementById('summary-location').textContent = user.profile.location;
          document.getElementById('summary-skillsOffered').textContent = user.profile.skillsOffered;
          document.getElementById('summary-skillsWanted').textContent = user.profile.skillsWanted;
          document.getElementById('summary-availability').textContent = user.profile.availability;
          document.getElementById('summary-contactPreference').textContent = user.profile.contactPreference;
          document.getElementById('summary-bio').textContent = user.profile.bio;

          // Show profile summary and hide form
          const profileSummary = document.getElementById('profile-summary');
          const profileForm = document.getElementById('profile-form');
          if (profileSummary && profileForm) {
            profileSummary.style.display = 'block';
            profileForm.style.display = 'none';
          }

          // Show success message if profile was just saved
          if (saved === 'true') {
            const successMessage = document.getElementById('success-message');
            if (successMessage) {
              successMessage.style.display = 'block';
            }
          }
        } else {
          // Show form and hide profile summary
          const profileForm = document.getElementById('profile-form');
          const profileSummary = document.getElementById('profile-summary');
          if (profileForm && profileSummary) {
            profileForm.style.display = 'block';
            profileSummary.style.display = 'none';
          }

          // Populate form fields if profile data exists
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

        // Add event listener for edit button
        const editButton = document.getElementById('edit-profile-button');
        if (editButton) {
          editButton.addEventListener('click', () => {
            const profileForm = document.getElementById('profile-form');
            const profileSummary = document.getElementById('profile-summary');
            const successMessage = document.getElementById('success-message');

            if (profileForm && profileSummary) {
              profileForm.style.display = 'block';
              profileSummary.style.display = 'none';
            }

            // Hide success message when editing
            if (successMessage) {
              successMessage.style.display = 'none';
            }
          });
        }
      } else {
        // If not logged in and on the dashboard page, redirect to login page
        if (window.location.pathname.endsWith('/dashboard.html')) {
          window.location.href = '/login.html';
        }
      }
    })
    .catch((error) => console.error('Error fetching session data:', error));
});
