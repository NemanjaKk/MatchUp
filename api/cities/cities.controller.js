'use strict';
const { City, Country } = require("../../models").models;

//TODO write tests and documentation
exports.getOne = async ctx => {
  let { cityId } = ctx.params;
  cityId = parseInt(cityId);
  if (!cityId) throw {status: 400, message: 'Invalid city id'};
  const city = await City.findOne({where: {id: cityId}, include: [Country]});
  if (!city) throw {status: 404, message: 'City not found'};
  ctx.body = city;
}

exports.getAll = async ctx => {
  ctx.body = await City.findAll();
}