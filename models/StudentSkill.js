const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class StudentSkill extends Model {}

StudentSkill.init({
  rating: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: "StudentSkill"
});

module.exports = StudentSkill;