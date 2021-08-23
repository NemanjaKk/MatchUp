const { getAll } = require("../../api/skills/skills.controller");
const Sequelize = require('../../models/db');
const { Skill } = require('../../models').models;
const cleanDatabase = require('../../utils/cleanDatabase.util');

const sequelize = new Sequelize().getInstance();

const noop = () => {};

const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.skill = await Skill.create({name: "test get all skills"});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("Some skills are returned", async function (){
  const ctx = {};
  await getAll(ctx, noop);
  expect(ctx.body.length).toBeGreaterThan(0);
  expect(ctx.body.find(e => e.id === o.skill.id).name).toBe("test get all skills");
  expect(ctx.status).toBe(200);
});