# Job Portal Web Application

A full-stack Job Portal built with Node.js, Express, SQLite, and EJS.

## Features

- Job Listings: Add, edit, delete, and view job postings
- User Profiles: Register, login, logout, view and update profile
- Job Applications: Apply to jobs and prevent duplicate applications
- Form validation, error handling, and responsive UI
- 15 automated test cases with Mocha + Chai
- Local SQLite database (no server setup required)

## Tech Stack

- Node.js
- Express.js
- SQLite + Sequelize ORM
- EJS templates
- Mocha, Chai, Supertest

## Project Structure

```text
app.js
config/
  db.js
middleware/
  auth.js
models/
  User.js
  Job.js
  Application.js
routes/
  auth.js
  jobs.js
  profile.js
views/
  partials/
  *.ejs
public/
  css/style.css
tests/
  app.test.js
```

## Setup and Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start the app:

```bash
npm start
```

Or:

```bash
node app.js
```

4. Open in browser:

- `http://localhost:3000`

## Run Tests

```bash
npm test
```

The suite contains 15 required test cases covering all major features.

## Database

The app uses **SQLite**, a file-based local database stored in `job_portal.db`. No server installation needed—it works automatically after `npm install`.

## Deployment Notes

### AWS EC2 (IaaS)

1. Launch EC2 instance and install Node.js.
2. Clone project and run `npm install`.
3. Set environment variables (`PORT`, `SESSION_SECRET`).
4. Start app with `node app.js` or use PM2.
5. Configure Security Group to allow app port (or reverse proxy with Nginx on port 80).

### AWS Elastic Beanstalk (PaaS)

1. Ensure `package.json` contains `start` script and `Procfile` exists.
2. Create Elastic Beanstalk Node.js environment.
3. Upload code bundle.
4. Set environment variables in Elastic Beanstalk Configuration.
5. For production, consider migrating to MongoDB Atlas or a managed SQL database.

## Important Production Notes

- Use a strong `SESSION_SECRET`.
- Use HTTPS and secure cookies in production.
- Add proper logging and monitoring for production workloads.
- For high-traffic scenarios, consider using a managed database service instead of local SQLite.
