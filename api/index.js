'use strict';

const fs = require('fs');
const path = require('path');
const Router = require('koa-router');
const swagger = require('swagger2');
const { ui } = require('swagger2-koa');
const sequelize = require('../models/db');

let swaggerDocument = null;
try{
  swaggerDocument = swagger.loadDocumentSync('./swagger.yml');
}catch (e){
  console.error("Unable to load the swagger document");
  console.dir(e);
}


const { apiVersion } = require('../config').server;
const baseName = path.basename(__filename);

function applyApiMiddleware(app) {
  const router = new Router({
    prefix: `/api/${apiVersion}`,
  });

  // Require all the folders and create a sub-router for each feature api
  fs.readdirSync(__dirname)
    .filter(file => file.indexOf('.') !== 0 && file !== baseName)
    .forEach(file => {
      const api = require(path.join(__dirname, file))(Router);
      router.use(api.routes());
    });
  if(swaggerDocument){
    app.use(ui(swaggerDocument, '/swagger'));
  }else{
    app.use(async (ctx, next) => {
      if (ctx.path === "/swagger")
        // if you change this message remember to change it in the test too
        ctx.body = "Sorry, there was an error with the swagger document and it is currently not available";
      else
        await next();
    });
  }
  app.use(router.routes()).use(router.allowedMethods());
}

module.exports = applyApiMiddleware;
