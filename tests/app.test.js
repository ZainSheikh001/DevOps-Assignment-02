const { expect } = require('chai');
const request = require('supertest');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

let app;

async function registerAndLogin(agent, user = {}) {
  const payload = {
    fullName: user.fullName || 'Test User',
    email: user.email || 'test@example.com',
    password: user.password || 'secret123',
  };

  await agent.post('/auth/register').type('form').send(payload);
  return payload;
}

async function createJobAsLoggedIn(agent, overrides = {}) {
  const jobPayload = {
    title: overrides.title || 'Node Developer',
    description: overrides.description || 'Build APIs and services',
    company: overrides.company || 'Acme Inc',
    location: overrides.location || 'Remote',
  };

  const res = await agent.post('/jobs').type('form').send(jobPayload);
  const location = res.headers.location || '';
  const jobId = location.split('/').pop();

  return { res, jobId, jobPayload };
}

describe('Job Portal Application', () => {
  before(async function () {
    this.timeout(60000);

    process.env.SESSION_SECRET = 'test_secret';

    const appModule = require('../app');
    app = appModule.app;

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Application.destroy({ where: {} });
    await Job.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  after(async () => {
    await sequelize.close();
  });

  it('1. Homepage loads', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Latest Job Listings');
  });

  it('2. Job listings load', async () => {
    const res = await request(app).get('/jobs');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('All Jobs');
  });

  it('3. Add a job', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const { res } = await createJobAsLoggedIn(agent);
    expect(res.status).to.equal(302);
    expect(res.headers.location).to.match(/^\/jobs\//);

    const jobs = await Job.findAll();
    expect(jobs).to.have.lengthOf(1);
  });

  it('4. Edit a job', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const { jobId } = await createJobAsLoggedIn(agent);

    const res = await agent.put(`/jobs/${jobId}`).type('form').send({
      title: 'Senior Node Developer',
      description: 'Design and build robust APIs',
      company: 'Acme Inc',
      location: 'Bangalore',
    });

    expect(res.status).to.equal(302);

    const updated = await Job.findByPk(jobId);
    expect(updated.title).to.equal('Senior Node Developer');
  });

  it('5. Delete a job', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const { jobId } = await createJobAsLoggedIn(agent);

    const res = await agent.delete(`/jobs/${jobId}`);
    expect(res.status).to.equal(302);

    const found = await Job.findByPk(jobId);
    expect(found).to.equal(null);
  });

  it('6. Job details page loads', async () => {
    const job = await Job.create({
      title: 'QA Engineer',
      description: 'Test web applications',
      company: 'Test Labs',
      location: 'Delhi',
    });

    const res = await request(app).get(`/jobs/${job.id}`);
    expect(res.status).to.equal(200);
    expect(res.text).to.include('QA Engineer');
  });

  it('7. User registration', async () => {
    const res = await request(app).post('/auth/register').type('form').send({
      fullName: 'Register User',
      email: 'register@example.com',
      password: 'secret123',
    });

    expect(res.status).to.equal(302);

    const user = await User.findOne({ where: { email: 'register@example.com' } });
    expect(user).to.exist;
  });

  it('8. User login', async () => {
    const hashed = await bcrypt.hash('secret123', 10);
    await User.create({
      fullName: 'Login User',
      email: 'login@example.com',
      password: hashed,
    });

    const res = await request(app).post('/auth/login').type('form').send({
      email: 'login@example.com',
      password: 'secret123',
    });

    expect(res.status).to.equal(302);
    expect(res.headers.location).to.equal('/');
  });

  it('9. Update profile', async () => {
    const agent = request.agent(app);
    const userData = await registerAndLogin(agent, {
      fullName: 'Profile User',
      email: 'profile@example.com',
      password: 'secret123',
    });

    const res = await agent.post('/profile').type('form').send({
      fullName: 'Profile Updated',
      bio: 'I love building software',
      skills: 'Node.js, SQLite',
      location: 'Pune',
    });

    expect(res.status).to.equal(200);
    expect(res.text).to.include('Profile updated successfully.');

    const user = await User.findOne({ where: { email: userData.email } });
    expect(user.fullName).to.equal('Profile Updated');
  });

  it('10. Apply to a job', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      fullName: 'Applicant User',
      email: 'applicant@example.com',
      password: 'secret123',
    });

    const { jobId } = await createJobAsLoggedIn(agent, {
      title: 'Backend Engineer',
    });

    const res = await agent
      .post(`/jobs/${jobId}/apply`)
      .type('form')
      .send({ coverLetter: 'I am a strong fit for this role.' });

    expect(res.status).to.equal(302);

    const apps = await Application.findAll({ where: { jobId } });
    expect(apps).to.have.lengthOf(1);
  });

  it('11. Prevent applying twice', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      fullName: 'Duplicate Applicant',
      email: 'dup@example.com',
      password: 'secret123',
    });

    const { jobId } = await createJobAsLoggedIn(agent, {
      title: 'DevOps Engineer',
    });

    await agent
      .post(`/jobs/${jobId}/apply`)
      .type('form')
      .send({ coverLetter: 'First attempt' });

    const second = await agent
      .post(`/jobs/${jobId}/apply`)
      .type('form')
      .send({ coverLetter: 'Second attempt' });

    expect(second.status).to.equal(400);
    expect(second.text).to.include('already applied');
  });

  it('12. Required fields validation', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.post('/jobs').type('form').send({
      title: '',
      description: 'desc',
      company: 'comp',
      location: 'loc',
    });

    expect(res.status).to.equal(400);
    expect(res.text).to.include('All fields are required.');
  });

  it('13. Database connection success', async () => {
    const res = await request(app).get('/health');
    expect(res.status).to.equal(200);
  });

  it('14. Server responds to invalid routes', async () => {
    const res = await request(app).get('/route-that-does-not-exist');
    expect(res.status).to.equal(404);
    expect(res.text).to.include('404');
  });

  it('15. Logout works correctly', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      fullName: 'Logout User',
      email: 'logout@example.com',
      password: 'secret123',
    });

    const logoutRes = await agent.get('/auth/logout');
    expect(logoutRes.status).to.equal(302);
    expect(logoutRes.headers.location).to.equal('/auth/login');

    const profileRes = await agent.get('/profile');
    expect(profileRes.status).to.equal(302);
    expect(profileRes.headers.location).to.equal('/auth/login');
  });
});
