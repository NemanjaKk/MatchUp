'use strict';

const http = require('http');
const server = require('./server');
const Sequelize = require('./models/db');
const models = require('./models');

const { port } = require('./config').server;

async function bootstrap() {
  /**
   * Add external services init as async operations (db, redis, etc...)
   * e.g.
   * await sequelize.authenticate()
   */

  try {
    const sequelize = new Sequelize().getInstance();
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  await models.sync();
  console.log('Models sync successfully');

  return http.createServer(server.callback()).listen(port);
}

bootstrap()
  .then(server =>
    console.log(`🚀 Server listening on port ${server.address().port}!`),
  )
  .catch(err => {
    setImmediate(() => {
      console.error('Unable to run the server because of the following error:');
      console.error(err);
      process.exit();
    });
  });
