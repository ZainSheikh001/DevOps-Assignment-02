const express = require('express');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  if (!user) {
    req.session.destroy(() => res.redirect('/auth/login'));
    return;
  }
  res.render('profile', { user, error: null, success: null });
});

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { fullName, bio, skills, location } = req.body;

    if (!fullName || !fullName.trim()) {
      const user = await User.findByPk(req.session.userId);
      return res.status(400).render('profile', {
        user,
        error: 'Full name is required.',
        success: null,
      });
    }

    const user = await User.findByPk(req.session.userId);
    await user.update({
      fullName: fullName.trim(),
      bio: (bio || '').trim(),
      skills: (skills || '').trim(),
      location: (location || '').trim(),
    });

    req.session.userName = user.fullName;

    return res.render('profile', {
      user,
      error: null,
      success: 'Profile updated successfully.',
    });
  } catch (error) {
    const user = await User.findByPk(req.session.userId);
    return res.status(500).render('profile', {
      user,
      error: 'Unable to update profile right now.',
      success: null,
    });
  }
});

module.exports = router;
