const r2 = require("r2");
const { getAllCategories } = require("../../api/skills/skills.controller");
const {  Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
    o.company = await Company.create({name:'Company'});
  });

afterAll(cleanDatabase.bind(null, o, sequelize));

//unit test
test('Get all the skill categories', async function() {
    const { company } = o;
    const ctx = { user: company};
    await getAllCategories(ctx, noop);
    expect(ctx.body.length).toBeGreaterThan(1);
  });