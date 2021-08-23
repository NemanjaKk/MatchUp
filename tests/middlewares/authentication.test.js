const signJWT = require('../../utils/signJWT');
const { authentication, studentAuthentication, companyAuthentication } = require('../../middleware/authentication');
const { Student, Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();
const o = {};

beforeAll(async () => {
  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student@testAuth.it" });
  o.company = await Company.create({email: 'company@testAuth.it', name: 'super company'});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests
test('student authentication works', async function() {
  const { student } = o;
  const token = signJWT({ id: student.id, userType: 'student' });
  const ctx = { header: { authorization: 'Bearer ' + token } };
  await authentication(ctx, noop);
  expect(ctx.user.email).toBe(student.email);
});

test('company authentication works', async function() {
  const { company } = o;
  const token = signJWT({ id: company.id, userType: 'company' });
  const ctx = { header: { authorization: 'Bearer ' + token } };
  await authentication(ctx, noop);
  await companyAuthentication(ctx, noop);
  expect(ctx.user.email).toBe(company.email);
});

test('user id does not exist', async function() {
  const token = signJWT({ id: 100000, userType: 'student' });
  const ctx = { header: { authorization: 'Bearer ' + token } };
  try{
    await authentication(ctx, noop);
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});

test('company tries to access student API', async function() {
  const { company } = o;
  const token = signJWT({ id: company.id, userType: 'company' });
  const ctx = { header: { authorization: 'Bearer ' + token } };
  await authentication(ctx, noop);
  try{
    await studentAuthentication(ctx, noop());
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});

test('student tries to access company API', async function() {
  const { student } = o;
  const token = signJWT({ id: student.id, userType: 'student' });
  const ctx = { header: { authorization: 'Bearer ' + token } };
  await authentication(ctx, noop);
  try{
    await companyAuthentication(ctx, noop());
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});