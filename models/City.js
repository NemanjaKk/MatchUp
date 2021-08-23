const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class City extends Model {}

City.init({
  name: {
    type: DataTypes.STRING
  },
  lat: {
    type: DataTypes.STRING
  },
  long: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: "City"
});

module.exports = City;