require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const { connectDB, sequelize } = require('./config/db');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const jobRoutes = require('./routes/jobs');

require('./models/User');
require('./models/Job');
require('./models/Application');

const Job = require('./models/Job');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    },
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = {
    id: req.session.userId || null,
    name: req.session.userName || null,
  };
  next();
});

app.get('/', async (req, res) => {
  try {
    const jobs = await Job.findAll({ order: [['createdAt', 'DESC']] });
    return res.render('home', { jobs: jobs.map(j => j.toJSON()) });
  } catch (error) {
    return res.status(500).send('Failed to load jobs.');
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    dbConnected: sequelize.authenticate().then(() => true).catch(() => false),
  });
});

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/jobs', jobRoutes);

app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  if (err) {
    return res.status(500).send('Internal Server Error');
  }
  return next();
});

async function startServer() {
  try {
    await connectDB();
    await sequelize.sync();
    const port = process.env.PORT || 3000;
    return app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  connectDB,
};
