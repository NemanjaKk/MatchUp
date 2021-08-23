const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class Country extends Model {}

Country.init({
  name: {
    type: DataTypes.STRING
  },
  code: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: "Country"
});

module.exports = Country;