const r2 = require("r2");
const { search } = require("../../api/skills/skills.controller");
const { Skill, SkillCategory, LevelDescription } = require('../../models').models;
const Sequelize = require('../../models/db');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  const skills = [];
  const firstCategory = await SkillCategory.create({name: "First Category", description: ""});
  const levelDescription11 = await LevelDescription.create({level: 1, description: "First Category first Level Description", SkillCategoryId: firstCategory.id});
  const levelDescription12 = await LevelDescription.create({level: 2, description: "First Category second Level Description", SkillCategoryId: firstCategory.id});
  const levelDescription13 = await LevelDescription.create({level: 3, description: "First Category third Level Description", SkillCategoryId: firstCategory.id});
  const secondCategory = await SkillCategory.create({name: "Second Category", description: ""});
  const levelDescription21 = await LevelDescription.create({level: 1, description: "Second Category first Level Description", SkillCategoryId: secondCategory.id});
  const levelDescription22 = await LevelDescription.create({level: 2, description: "Second Category second Level Description", SkillCategoryId: secondCategory.id});
  const levelDescription23 = await LevelDescription.create({level: 3, description: "Second Category third Level Description", SkillCategoryId: secondCategory.id});
  const levelDescription24 = await LevelDescription.create({level: 4, description: "Second Category fourth Level Description", SkillCategoryId: secondCategory.id});
  const firstSkill = await Skill.create({ name: "First Skill", SkillCategoryId: firstCategory.id });
  const secondSkill = await Skill.create({ name: "Second Skill", SkillCategoryId: secondCategory.id });
  skills.push(firstSkill);
  skills.push(secondSkill);
  o.skills = skills;
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("There are skills with the given skill name", async function (){
  const ctx = { params: { name: 'First S' } };
  await search(ctx, noop);
  expect(ctx.body[0].name).toBe('First Skill');
  expect(ctx.body[0].SkillCategory.LevelDescriptions.length).toBe(3);
});

test("There are skills with the given category name", async function (){
  const ctx = { params: { name: 'Second C' } };
  await search(ctx, noop);
  expect(ctx.body[0].name).toBe('Second Skill');
  expect(ctx.body[0].SkillCategory.LevelDescriptions.length).toBe(4);
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("There are skills with the given skill name - API version", async function (){
  const url = `http://localhost:3000/api/v1/skills/search/First%S`;
  const response = await r2.get(url).json;
  expect(response[0].name).toBe('First Skill');
  expect(response[0].SkillCategory.LevelDescriptions.length).toBe(3);
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("There are skills with the given category name - API version", async function (){
  const url = `http://localhost:3000/api/v1/skills/search/Second%C`;
  const response = await r2.get(url).json;
  expect(response[0].name).toBe('Second Skill');
  expect(response[0].SkillCategory.LevelDescriptions.length).toBe(4);
});