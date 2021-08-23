const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class JobCategory extends Model {}

JobCategory.init({
  name: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: "JobCategory"
});

module.exports = JobCategory;