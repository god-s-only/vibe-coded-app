// DOM Elements
const darkModeToggle = document.getElementById('dark-mode-toggle');
const colorOptions = document.querySelectorAll('.color-option');
const emailNotificationsToggle = document.getElementById('email-notifications-toggle');
const transactionAlertsToggle = document.getElementById('transaction-alerts-toggle');
const languageSelect = document.getElementById('language-select');
const enable2faButton = document.getElementById('enable-2fa');
const changePasswordButton = document.getElementById('change-password');

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});

// Load user settings from localStorage
function loadSettings() {
  // Load dark mode preference
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  darkModeToggle.checked = isDarkMode;
  updateTheme(isDarkMode);

  // Load accent color
  const savedColor = localStorage.getItem('accentColor') || '#4a90e2';
  document.documentElement.style.setProperty('--accent-color', savedColor);
  colorOptions.forEach(option => {
    if (option.dataset.color === savedColor) {
      option.classList.add('active');
    }
  });

  // Load notification preferences
  emailNotificationsToggle.checked = localStorage.getItem('emailNotifications') !== 'false';
  transactionAlertsToggle.checked = localStorage.getItem('transactionAlerts') !== 'false';

  // Load language preference
  const savedLanguage = localStorage.getItem('language') || 'en';
  languageSelect.value = savedLanguage;
}

// Set up event listeners
function setupEventListeners() {
  // Dark mode toggle
  darkModeToggle.addEventListener('change', (e) => {
    const isDarkMode = e.target.checked;
    localStorage.setItem('darkMode', isDarkMode);
    updateTheme(isDarkMode);
  });

  // Accent color selection
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const color = option.dataset.color;
      document.documentElement.style.setProperty('--accent-color', color);
      localStorage.setItem('accentColor', color);
      
      // Update active state
      colorOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
    });
  });

  // Notification toggles
  emailNotificationsToggle.addEventListener('change', (e) => {
    localStorage.setItem('emailNotifications', e.target.checked);
  });

  transactionAlertsToggle.addEventListener('change', (e) => {
    localStorage.setItem('transactionAlerts', e.target.checked);
  });

  // Language selection
  languageSelect.addEventListener('change', (e) => {
    localStorage.setItem('language', e.target.value);
    // Here you would typically trigger a page reload or language change
  });

  // 2FA button
  enable2faButton.addEventListener('click', () => {
    // Implement 2FA setup logic
    alert('2FA setup will be implemented here');
  });

  // Change password button
  changePasswordButton.addEventListener('click', () => {
    // Implement password change logic
    alert('Password change will be implemented here');
  });
}

// Update theme based on dark mode preference
function updateTheme(isDarkMode) {
  if (isDarkMode) {
    document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
    document.documentElement.style.setProperty('--card-bg', '#2a2a2a');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
    document.documentElement.style.setProperty('--text-secondary', '#888888');
    document.documentElement.style.setProperty('--border-color', '#333333');
    document.documentElement.style.setProperty('--input-bg', '#333333');
  } else {
    document.documentElement.style.setProperty('--bg-color', '#f5f5f5');
    document.documentElement.style.setProperty('--card-bg', '#ffffff');
    document.documentElement.style.setProperty('--text-color', '#333333');
    document.documentElement.style.setProperty('--text-secondary', '#666666');
    document.documentElement.style.setProperty('--border-color', '#e0e0e0');
    document.documentElement.style.setProperty('--input-bg', '#f0f0f0');
  }
}
