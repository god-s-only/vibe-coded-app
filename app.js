const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load environment variables
const result = dotenv.config();
console.log('Dotenv config result:', result);
console.log('Current working directory:', process.cwd());
console.log('Email password loaded:', process.env.EMAIL_PASSWORD ? 'Yes' : 'No');
console.log('All environment variables:', process.env);

// Import routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/authRoutes');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'joshua34111@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP configuration error:', error);
    console.log('Current auth configuration:', {
      user: 'joshua34111@gmail.com',
      pass: process.env.EMAIL_PASSWORD ? 'Password is set' : 'Password is missing'
    });
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', authRouter);  // Mount auth routes at root level

// Settings route
app.get('/settings', (req, res) => {
  res.render('settings');
});

// Support email route
app.post('/api/support', async (req, res) => {
  try {
    const { message, userEmail, userName } = req.body;

    const mailOptions = {
      from: 'joshua34111@gmail.com',
      to: 'joshua34111@gmail.com',
      subject: `Support Request from ${userName}`,
      text: `
Support Request Details:
----------------------
From: ${userName}
Email: ${userEmail}
Message:
${message}
      `,
      html: `
        <h2>Support Request Details</h2>
        <p><strong>From:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Support request sent successfully' });
  } catch (error) {
    console.error('Error sending support email:', error);
    res.status(500).json({ error: 'Failed to send support request' });
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;