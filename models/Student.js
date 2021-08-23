const Sequelize = require('./db');
const { Model, DataTypes } = require('sequelize');

const sequelize = new Sequelize().getInstance();

class Student extends Model {}

Student.init({
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    unique: true
  },
  password: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.STRING
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  picture: {
    type: DataTypes.STRING
  },
  CityId: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: "Student"
});

module.exports = Student;
