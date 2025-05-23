// CLIENT-SIDE ONLY - Remove all Firebase Admin code!

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

// Initialize Firebase CLIENT SDK
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');
const balanceAmount = document.getElementById('balance-amount');
const balanceToggle = document.getElementById('balance-toggle');
const withdrawBtn = document.getElementById('withdraw-btn');
const withdrawModal = document.getElementById('withdraw-modal');
const modalClose = document.getElementById('modal-close');
const withdrawForm = document.getElementById('withdraw-form');
const logoutBtn = document.getElementById('logout-btn');

let balanceVisible = true;
let currentUser = null;
let userBalance = '0.00';

// Check authentication state
auth.onAuthStateChanged(async (user) => {
  console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
  
  if (user) {
    currentUser = user;
    console.log(`User authenticated: ${user.uid}, Email verified: ${user.emailVerified}`);
    await loadUserData(user);
    hideLoading();
  } else {
    console.log('No authenticated user, redirecting to signin');
    window.location.href = '/signin';
  }
});

// Load user data from Firestore
async function loadUserData(user) {
  try {
    console.log('Loading user data for:', user.uid);
    
    // Update user info in header
    userName.textContent = `Welcome back, ${user.displayName || 'User'}`;
    userEmail.textContent = user.email;
    
    if (user.photoURL) {
      userAvatar.src = user.photoURL;
    }
    
    // Load user data from Firestore
    console.log('Fetching user document from Firestore...');
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      console.log('User document found:', userDoc.data());
      const userData = userDoc.data();
      userBalance = userData.balance || '$0.00';
      
      // Remove currency symbol for display
      const balanceValue = userBalance.replace('$', '');
      balanceAmount.textContent = balanceValue;
      balanceAmount.setAttribute('data-balance', balanceValue);
    } else {
      console.log('User document not found, creating default...');
      
      // Create user document if it doesn't exist
      const newUserData = {
        fullName: user.displayName || '',
        email: user.email,
        balance: '$0.00',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(user.uid).set(newUserData);
      console.log('Created new user document');
      
      userBalance = '$0.00';
      balanceAmount.textContent = '0.00';
      balanceAmount.setAttribute('data-balance', '0.00');
    }
    
  } catch (error) {
    console.error('Error loading user data:', error);
    
    // Set default values if error
    userBalance = '$0.00';
    balanceAmount.textContent = '0.00';
    balanceAmount.setAttribute('data-balance', '0.00');
    
    // Show balance visibility by default
    balanceVisible = true;
    balanceAmount.textContent = '0.00';
  }
}

// Toggle balance visibility
balanceToggle.addEventListener('click', function() {
  balanceVisible = !balanceVisible;
  const balanceValue = balanceAmount.getAttribute('data-balance');
  
  if (balanceVisible) {
    balanceAmount.textContent = balanceValue;
    balanceToggle.querySelector('.icon').textContent = '👁️';
  } else {
    balanceAmount.textContent = '••••••';
    balanceToggle.querySelector('.icon').textContent = '👁️‍🗨️';
  }
});

// Show withdraw modal
withdrawBtn.addEventListener('click', function() {
  withdrawModal.classList.add('active');
});

// Close modal
modalClose.addEventListener('click', function() {
  withdrawModal.classList.remove('active');
});

// Close modal when clicking outside
withdrawModal.addEventListener('click', function(e) {
  if (e.target === withdrawModal) {
    withdrawModal.classList.remove('active');
  }
});

// Handle withdraw form submission
withdrawForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const amount = document.getElementById('withdraw-amount').value;
  const method = document.getElementById('withdraw-method').value;
  
  if (amount && method) {
    alert(`Withdrawal request submitted: $${amount} via ${method}`);
    withdrawModal.classList.remove('active');
    withdrawForm.reset();
  }
});

// Logout functionality
logoutBtn.addEventListener('click', async function() {
  try {
    await auth.signOut();
    // Clear cookie
    document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/signin';
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Hide loading overlay
function hideLoading() {
  console.log('Hiding loading overlay');
  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
  }, 1000);
}

// Quick action clicks
document.querySelectorAll('.action-card').forEach(card => {
  card.addEventListener('click', function() {
    const title = this.querySelector('h3').textContent;
    alert(`${title} feature coming soon!`);
  });
});

// Force hide loading after 5 seconds as fallback
setTimeout(() => {
  if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
    console.log('Force hiding loading overlay after timeout');
    loadingOverlay.classList.add('hidden');
  }
}, 5000);