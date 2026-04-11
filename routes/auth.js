const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.get('/register', (req, res) => {
  res.render('register', { error: null, old: {} });
});

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).render('register', {
        error: 'All fields are required.',
        old: { fullName, email },
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).render('register', {
        error: 'Please enter a valid email address.',
        old: { fullName, email },
      });
    }

    if (password.length < 6) {
      return res.status(400).render('register', {
        error: 'Password must be at least 6 characters.',
        old: { fullName, email },
      });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).render('register', {
        error: 'Email is already registered.',
        old: { fullName, email },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    req.session.userId = user.id;
    req.session.userName = user.fullName;
    return res.redirect('/');
  } catch (error) {
    return res.status(500).render('register', {
      error: 'Unable to register at the moment.',
      old: req.body,
    });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null, old: {} });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', {
        error: 'Email and password are required.',
        old: { email },
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).render('login', {
        error: 'Invalid credentials.',
        old: { email },
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).render('login', {
        error: 'Invalid credentials.',
        old: { email },
      });
    }

    req.session.userId = user.id;
    req.session.userName = user.fullName;
    return res.redirect('/');
  } catch (error) {
    return res.status(500).render('login', {
      error: 'Unable to login at the moment.',
      old: req.body,
    });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
