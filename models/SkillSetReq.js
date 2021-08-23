const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class SkillSetReq extends Model {}

SkillSetReq.init({

}, {
  sequelize,
  modelName: "SkillSetReq"
});

module.exports = SkillSetReq;