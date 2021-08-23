const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class Application extends Model {}

Application.init({
  date: {
    type: DataTypes.DATE
  },
  declined: {
    type: DataTypes.BOOLEAN
  },
  alreadyNotified:{
    type: DataTypes.BOOLEAN
  },
  createdAt: {
    type: DataTypes.DATE
  },
  updatedAt: {
    type: DataTypes.DATE
  },
  StudentId: {
    type: DataTypes.INTEGER
  },
  JobId: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: "Application"
});

module.exports = Application;