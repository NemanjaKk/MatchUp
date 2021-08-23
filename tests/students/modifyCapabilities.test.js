const r2 = require("r2");
const { Student, Skill, SkillCategory, StudentSkill, LevelDescription } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');
const { editCapability, addCapability, removeCapability } = require("../../api/students/student.controller");
const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student@modifyCapabilities.com" });
  o.studentAPI = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentAPI@modifyCapabilities.com" });
  o.student2 = await Student.create({ firstName: 'Pepe', lastName: 'Pluto', email: "student2@modifyCapabilities.com" });

  o.skillCategory = await SkillCategory.create({name: "Modify capabilities"});
  o.skill = await Skill.create({name: "modify capabilities test skill 0", SkillCategoryId: o.skillCategory.id});
  o.skill2 = await Skill.create({name: "modify capabilities test skill 2", SkillCategoryId: o.skillCategory.id});
  o.skillAlreadyExisting1 = await Skill.create({name: "modify capabilities test skill 1", SkillCategoryId: o.skillCategory.id});
  o.skillAlreadyExisting2 = await Skill.create({name: "modify capabilities test skill 2", SkillCategoryId: o.skillCategory.id});
  o.skillAlreadyExisting3 = await Skill.create({name: "modify capabilities test skill 3", SkillCategoryId: o.skillCategory.id});
  o.skillNotUsed = await Skill.create({name: "Nobody has this skill", SkillCategoryId: o.skillCategory.id});

  o.level1 = await LevelDescription.create({level: 1, SkillCategoryId: o.skillCategory.id});
  o.level2 = await LevelDescription.create({level: 2, SkillCategoryId: o.skillCategory.id});
  o.level3 = await LevelDescription.create({level: 3, SkillCategoryId: o.skillCategory.id});
  o.level4 = await LevelDescription.create({level: 4, SkillCategoryId: o.skillCategory.id});
  o.level5 = await LevelDescription.create({level: 5, SkillCategoryId: o.skillCategory.id});

  o.studentSkill1 = await StudentSkill.create({StudentId: o.student.id, SkillId: o.skillAlreadyExisting1.id, rating: 3 });
  o.studentSkill2 = await StudentSkill.create({StudentId: o.student.id, SkillId: o.skillAlreadyExisting2.id, rating: 3 });
  o.studentSkill3 = await StudentSkill.create({StudentId: o.student.id, SkillId: o.skillAlreadyExisting3.id, rating: 3 });
  o.studentApiSkill1 = await StudentSkill.create({StudentId: o.studentAPI.id, SkillId: o.skillAlreadyExisting1.id, rating: 3 });
  o.studentApiSkill2 = await StudentSkill.create({StudentId: o.studentAPI.id, SkillId: o.skillAlreadyExisting2.id, rating: 3 });
  o.studentApiSkill3 = await StudentSkill.create({StudentId: o.studentAPI.id, SkillId: o.skillAlreadyExisting3.id, rating: 3 });
  o.student2Skill = await StudentSkill.create({StudentId: o.student2.id, SkillId: o.skill2.id, rating: 3 });

});

afterAll(cleanDatabase.bind(null, o, sequelize));
//unit test

test("Skill already exist", async function (){
  const {student} = o;
  const ctx = {request: { body: {id: 1, rating: 3,}}, user:student};
  try{
    await addCapability(ctx,noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test("Skill already exist v2", async function (){
  const {student2, skill2} = o;
  const ctx = {request: { body: {id: skill2.id, rating: 3,}}, user:student2};
  try{
    await addCapability(ctx,noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test("Add capability", async function (){
  const {student} = o;
  const ctx = {request: { body: {id: 4, rating: 3,}}, user:student};
  try{
    await addCapability(ctx,noop);
  }catch(e){
    expect(e.status).toBe(200);
    expect(e.message).toBeDefined();
  }
});
test("Remove capability", async function (){
  const {student} = o;
  const ctx = {request: { body: {removeSkillId: 1}}, user:student};
  try{
    await removeCapability(ctx,noop);
  }catch(e){
    expect(e.status).toBe(200);
    expect(e.message).toBeDefined();
  }
});
test("Capability does not exist", async function (){
  const {student} = o;
  const ctx = {request: { body: {removeSkillId: 1}}, user:student};
  try{
    await removeCapability(ctx,noop);
  }catch(e){
    expect(e.status).toBe(404);
    expect(e.message).toBeDefined();
  }
});

test("Edit rating", async function (){
  const { student, skillAlreadyExisting1, studentSkill1 } = o;
  const ctx = { user: student, request: { body: {id: skillAlreadyExisting1.id, rating: 5}}};
  await editCapability(ctx, noop);
  await studentSkill1.reload();
  expect(studentSkill1.rating).toBe(5);
  expect(ctx.status).toBe(201);
});

test("Edit rating - skill id is a string", async function (){
  const { student } = o;
  const ctx = { user: student, request: { body: {id: "hello", rating: 5}}};
  try{
    await editCapability(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
});

test("Edit rating - skill id is undefined", async function (){
  const { student } = o;
  const ctx = { user: student, request: { body: {id: undefined, rating: 5}}};
  try{
    await editCapability(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
});

test("Edit rating - rating is a string", async function (){
  const { student, skillAlreadyExisting2, studentSkill2 } = o;
  const ctx = { user: student, request: { body: {id: skillAlreadyExisting2.id, rating: "hello"}}};
  try{
    await editCapability(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
  await studentSkill2.reload();
  expect(studentSkill2.rating).toBe(3);
});

test("Edit rating - rating is not in range", async function (){
  const { student, skillAlreadyExisting2, studentSkill2 } = o;
  const ctx = { user: student, request: { body: {id: skillAlreadyExisting2.id, rating: 1000}}};
  try{
    await editCapability(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
  await studentSkill2.reload();
  expect(studentSkill2.rating).toBe(3);
});

test("Edit rating - student does not have the skill", async function (){
  const { student, skillNotUsed } = o;
  const ctx = { user: student, request: { body: {id: skillNotUsed.id, rating: 5}}};
  try{
    await editCapability(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBe("This student does not have this skill");
  }
});

test("Add capability - API version", async function (){
  const { studentAPI, skill } = o;
  const studentId = studentAPI.id;
  const jwt = signJWT({id: studentId, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/addCapability/`;
  const response = await r2.post(url,{json:{id:skill.id, rating: 3},headers: {authorization: "Bearer " + jwt}}).response;
  expect(response.status).toBe(201);
});

test("Capability already exist- API version", async function (){
  const { studentAPI, skillAlreadyExisting1 } = o;
  const studentId = studentAPI.id;
  const jwt = signJWT({id: studentId, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/addCapability/`;
  const response = await r2.post(url,{json:{id:skillAlreadyExisting1.id, rating: 5},headers: {authorization: "Bearer " + jwt}}).response;
  expect(response.status).toBe(400);
});

test("Remove capability - API version", async function (){
  const { studentAPI, skillAlreadyExisting2 } = o;
  const studentId = studentAPI.id;
  const jwt = signJWT({id: studentId, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/removeCapability/`;
  const response = await r2.post(url,{json:{removeSkillId:skillAlreadyExisting2.id},headers: {authorization: "Bearer " + jwt}}).response;
  expect(response.status).toBe(200);
});









