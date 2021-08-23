const { jwtSecret } = require('../config/components/server.config');
const jwt = require('jsonwebtoken');
const { Student, Company } = require('../models').models;

module.exports = {
  authentication: async (ctx, next) => {
    if (!ctx.header.authorization) throw { status: 401, message: 'No authorization found' };
    const token = ctx.header.authorization.replace('Bearer ', '');
    const jwtObj = jwt.verify(token, jwtSecret);
    const model = jwtObj.userType === 'student' ? Student : Company;
    ctx.user = await model.findByPk(jwtObj.id);
    if (!ctx.user) throw { status: 401, message: 'No user found with the given jwt' }
    ctx.userType = jwtObj.userType;
    await next();
  },
  studentAuthentication: async (ctx, next) => {
    if (ctx.userType !== "student") throw {status: 401, message: "You must be a student to use this API"};
    await next();
  },
  companyAuthentication: async (ctx, next) => {
    if (ctx.userType !== "company") throw {status: 401, message: "You must be a company to use this API"};
    await next();
  }
}
