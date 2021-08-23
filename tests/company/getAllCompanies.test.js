const r2 = require("r2");
const { getAll } = require("../../api/companies/company.controller");
const { Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.company1 = await Company.create({email: "company1@company.com"});
  o.company2 = await Company.create({email: "company2@company.com"});
  o.company3 = await Company.create({email: "company3@company.com"});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

test("You can get all the companies", async function(){
    const ctx = { };
    await getAll(ctx, noop);
    expect(ctx.body.length).toBeGreaterThan(1);
  })