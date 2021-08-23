const r2 = require("r2");
const { getOne } = require("../../api/skills/skills.controller");
const { Skill, SkillCategory } = require('../../models').models;
const Sequelize = require('../../models/db');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  const skills = [];
  const getSkill = name => skills.find(s => s.name === name);
  const lang = await SkillCategory.create({name: "Programming Languages", description: ""});
  const tech = await SkillCategory.create({name: "Technologies", description: ""})
  const c = await Skill.create({ name: "C#", SkillCategoryId: lang.id })
  const nodeJS = await Skill.create({ name: "NodeJS", SkillCategoryId: tech.id });
  skills.push(c);
  skills.push(nodeJS);
  o.skills = skills;
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("The skill exists", async function (){
  const { skills } = o
  const c = skills.find(s => s.name === "C#");
  const ctx = { params: { skillId: c.id } };
  await getOne(ctx, noop);
  expect(ctx.body.name).toBe('C#');
  expect(ctx.body.SkillCategory.id).toBe(c.SkillCategoryId);
});

test("Search skill with a string as id returns 400", async function (){
  const ctx = {params: { skillId: 'hello' }};
  try{
    await getOne(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test("Search skill with an id that does not exist returns 404", async function (){
  const ctx = {params: { skillId: 100000 }};
  try{
    await getOne(ctx, noop);
  }catch(e){
    expect(e.status).toBe(404);
    expect(e.message).toBeDefined();
  }
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The skill exists - API version", async function (){
  const { skills } = o
  const nodeJS = skills.find(s => s.name === "NodeJS");
  const url = `http://localhost:3000/api/v1/skills/getOne/${nodeJS.id}`;
  const response = await r2.get(url).json;
  expect(response.id).toBe(nodeJS.id);
});
