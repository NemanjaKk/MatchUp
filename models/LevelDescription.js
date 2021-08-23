const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class LevelDescription extends Model {}

LevelDescription.init({
  level: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.TEXT
  },
  SkillCategoryId: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: "LevelDescription"
});

module.exports = LevelDescription;