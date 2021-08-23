'use strict';
const { City, Country } = require("../../models").models;

//TODO write tests and documentation
exports.getOne = async ctx => {
  let { countryId } = ctx.params;
  countryId = parseInt(countryId);
  if (!countryId) throw {status: 400, message: 'Invalid country id'};
  const country = await Country.findOne({where: {id: countryId}, include: [City]});
  if (!country) throw {status: 404, message: 'Country not found'};
  ctx.body = country;
}

exports.getAll = async ctx => {
  ctx.body = await Country.findAll();
}