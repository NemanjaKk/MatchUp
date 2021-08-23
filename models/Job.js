const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class Job extends Model {}

Job.init({
  name: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  timeLimit: {
    type: DataTypes.DATE
  },
  salary: {
    type: DataTypes.INTEGER
  },
  partTime: {
    type: DataTypes.BOOLEAN
  },
  remote: {
    type: DataTypes.BOOLEAN 
  }
}, {
  sequelize,
  modelName: "Job"
});

module.exports = Job;