const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class SkillCategory extends Model {}

SkillCategory.init({
  name: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: "SkillCategory"
});

module.exports = SkillCategory;