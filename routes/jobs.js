const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

function validateJobInput({ title, description, company, location }) {
  return Boolean(title && description && company && location);
}

router.get('/', async (req, res) => {
  const jobs = await Job.findAll({ order: [['createdAt', 'DESC']] });
  res.render('jobs-list', { jobs: jobs.map(j => j.toJSON()) });
});

router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('add-job', { error: null, old: {} });
});

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { title, description, company, location } = req.body;

    if (!validateJobInput(req.body)) {
      return res.status(400).render('add-job', {
        error: 'All fields are required.',
        old: { title, description, company, location },
      });
    }

    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      company: company.trim(),
      location: location.trim(),
    });

    return res.redirect(`/jobs/${job.id}`);
  } catch (error) {
    return res.status(500).render('add-job', {
      error: 'Unable to create job right now.',
      old: req.body,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).render('404');
    }

    let hasApplied = false;
    if (req.session.userId) {
      const existing = await Application.findOne({
        where: {
          jobId: job.id,
          userId: req.session.userId,
        },
      });
      hasApplied = Boolean(existing);
    }

    return res.render('job-details', { job: job.toJSON(), hasApplied });
  } catch (error) {
    return res.status(404).render('404');
  }
});

router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).render('404');
    }

    return res.render('edit-job', { job: job.toJSON(), error: null });
  } catch (error) {
    return res.status(404).render('404');
  }
});

router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { title, description, company, location } = req.body;

    if (!validateJobInput(req.body)) {
      return res.status(400).render('edit-job', {
        job: { id: req.params.id, title, description, company, location },
        error: 'All fields are required.',
      });
    }

    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).render('404');
    }

    await job.update({
      title: title.trim(),
      description: description.trim(),
      company: company.trim(),
      location: location.trim(),
    });

    return res.redirect(`/jobs/${job.id}`);
  } catch (error) {
    return res.status(500).render('edit-job', {
      job: { id: req.params.id, ...req.body },
      error: 'Unable to update job right now.',
    });
  }
});

router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    await Application.destroy({ where: { jobId: req.params.id } });
    await Job.destroy({ where: { id: req.params.id } });
    return res.redirect('/');
  } catch (error) {
    return res.status(500).send('Unable to delete job.');
  }
});

router.get('/:id/apply', ensureAuthenticated, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).render('404');
    }

    const existing = await Application.findOne({
      where: {
        jobId: req.params.id,
        userId: req.session.userId,
      },
    });

    if (existing) {
      return res.status(400).render('apply-job', {
        job: job.toJSON(),
        error: 'You have already applied to this job.',
        old: {},
      });
    }

    return res.render('apply-job', { job: job.toJSON(), error: null, old: {} });
  } catch (error) {
    return res.status(404).render('404');
  }
});

router.post('/:id/apply', ensureAuthenticated, async (req, res) => {
  try {
    const { coverLetter } = req.body;
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).render('404');
    }

    if (!coverLetter || !coverLetter.trim()) {
      return res.status(400).render('apply-job', {
        job: job.toJSON(),
        error: 'Cover letter is required.',
        old: { coverLetter },
      });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(401).redirect('/auth/login');
    }

    const existing = await Application.findOne({
      where: {
        jobId: job.id,
        userId: user.id,
      },
    });

    if (existing) {
      return res.status(400).render('apply-job', {
        job: job.toJSON(),
        error: 'You have already applied to this job.',
        old: req.body,
      });
    }

    await Application.create({
      jobId: job.id,
      userId: user.id,
      applicantName: user.fullName,
      applicantEmail: user.email,
      coverLetter: coverLetter.trim(),
    });

    return res.redirect(`/jobs/${job.id}`);
  } catch (error) {
    const job = await Job.findByPk(req.params.id);
    return res.status(500).render('apply-job', {
      job: job.toJSON(),
      error: 'Unable to submit your application right now.',
      old: req.body,
    });
  }
});

module.exports = router;
