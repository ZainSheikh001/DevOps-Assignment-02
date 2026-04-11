const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Job = require('./Job');

const Application = sequelize.define('Application', {
  applicantName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  applicantEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

Application.belongsTo(Job, { foreignKey: 'jobId' });
Application.belongsTo(User, { foreignKey: 'userId' });
Job.hasMany(Application, { foreignKey: 'jobId' });
User.hasMany(Application, { foreignKey: 'userId' });

module.exports = Application;
