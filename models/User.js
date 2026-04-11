const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  skills: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
});

module.exports = User;
