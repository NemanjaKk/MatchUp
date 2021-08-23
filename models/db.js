const { Sequelize } = require('sequelize');

const env = process.env;
const { databaseConfig } = require("../config");

class Singleton {
  constructor() {
    if (!Singleton.instance) {
      if (env.DATABASE_URL) {
        Singleton.instance = new Sequelize(env.DATABASE_URL);
      } else {
        Singleton.instance = new Sequelize(env.DB_DATABASE, env.DB_USER, env.DB_PASSWORD, { host: env.DB_HOST, dialect: 'postgres', logging: databaseConfig.showQueries });
      }
    }
  }

  getInstance() {
    return Singleton.instance;
  }
}

module.exports = Singleton;