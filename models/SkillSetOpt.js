const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class SkillSetOpt extends Model {}

SkillSetOpt.init({

}, {
  sequelize,
  modelName: "SkillSetOpt"
});

module.exports = SkillSetOpt;