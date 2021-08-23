const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class Matching extends Model {}

Matching.init({
  date: {
    type: DataTypes.DATE
  },
  discarded: {
    type: DataTypes.BOOLEAN
  }
}, {
  sequelize,
  modelName: "Matching"
});

module.exports = Matching;