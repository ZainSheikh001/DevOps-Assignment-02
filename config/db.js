const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to database:', error.message);
    throw error;
  }
}

module.exports = {
  connectDB,
  sequelize,
};