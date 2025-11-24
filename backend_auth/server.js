const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ⭐ Mongoose connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Error:', err));

// Middlewares
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

// 📌 User Model with time tracking
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    photo: String,
    firstLoginAt: { type: Date },  // When user first logged in
    lastLoginAt: { type: Date }    // When user last logged in
  })
);

// 🔐 Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        const currentTime = new Date();

        if (!user) {
          // 👉 First login
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0]?.value,
            firstLoginAt: currentTime,
            lastLoginAt: currentTime
          });
        } else {
          // 👉 Update last login time only
          user.lastLoginAt = currentTime;
          await user.save();
        }

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// 📍 Routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: CLIENT_URL }),
  (req, res) => res.redirect(CLIENT_URL)
);

app.get('/api/auth/me', (req, res) => res.json({ user: req.user || null }));

app.get('/api/auth/logout', (req, res) => {
  req.logout(() => {});
  res.redirect(CLIENT_URL);
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth Server → http://localhost:${PORT}`);
  console.log(`Frontend URL → ${CLIENT_URL}`);
});
