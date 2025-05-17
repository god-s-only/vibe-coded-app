

const firebaseConfig = {
  apiKey: "AIzaSyCnj0IErUeGXEGl72I8495ZS1RHeuOBwfY",
  authDomain: "fir-demo-app-f3342.firebaseapp.com",
  databaseURL: "https://fir-demo-app-f3342-default-rtdb.firebaseio.com",
  projectId: "fir-demo-app-f3342",
  storageBucket: "fir-demo-app-f3342.firebasestorage.app",
  messagingSenderId: "690323727261",
  appId: "1:690323727261:web:4bdeea8a182e62cd4e8574",
  measurementId: "G-BXYG86T6S0"
};




// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
  const signinForm = document.getElementById('signin-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const signinButton = document.getElementById('signin-button');
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessage = document.getElementById('error-message');
  const togglePassword = document.querySelector('.toggle-password');
  const googleButton = document.querySelector('.google-button');
  const githubButton = document.querySelector('.github-button');

  // Handle password visibility toggle
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  }

  // Check if user is already signed in
  auth.onAuthStateChanged(user => {
    if (user) {
      // User is signed in, redirect to dashboard
      window.location.href = '/dashboard';
    }
  });

  // Handle form submission
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    signinButton.disabled = true;
    loadingSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    try {
      // Attempt to sign in with email and password
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      
      // Get the user's ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Store the token in a cookie for server-side authentication
      document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
      
      // Redirect will happen via onAuthStateChanged listener
    } catch (error) {
      // Handle sign-in errors
      errorMessage.textContent = getErrorMessage(error);
      errorMessage.classList.remove('hidden');
      
      // Reset loading state
      signinButton.disabled = false;
      loadingSpinner.classList.add('hidden');
    }
  });

  // Google Sign In
  if (googleButton) {
    googleButton.addEventListener('click', async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      
      try {
        errorMessage.classList.add('hidden');
        await auth.signInWithPopup(provider);
        // Redirect will happen via onAuthStateChanged listener
      } catch (error) {
        errorMessage.textContent = getErrorMessage(error);
        errorMessage.classList.remove('hidden');
      }
    });
  }

  // GitHub Sign In
  if (githubButton) {
    githubButton.addEventListener('click', async () => {
      const provider = new firebase.auth.GithubAuthProvider();
      
      try {
        errorMessage.classList.add('hidden');
        await auth.signInWithPopup(provider);
        // Redirect will happen via onAuthStateChanged listener
      } catch (error) {
        errorMessage.textContent = getErrorMessage(error);
        errorMessage.classList.remove('hidden');
      }
    });
  }
  
  // Helper function to convert Firebase error codes to user-friendly messages
  function getErrorMessage(error) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials.';
      default:
        console.error('Auth error:', error);
        return 'An error occurred. Please try again.';
    }
  }
});