const r2 = require("r2");
const { update } = require("../../api/companies/company.controller");
const {  Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const { hash, compare } =require("../../utils/password");
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
    const hashed = await hash("oldPassword");
    o.companyThatAlreadyExists = await Company.create({email: "hello@alreadyExisting.co", name: "Very old company"});
    o.company = await Company.create({email: "company@old.com", name: "oldName", description: "Old description", password: hashed, picture: "oldPic.png"});
    o.company2 = await Company.create({email: "company2@old.com", name: "oldName", description: "Old description", password: hashed, picture: "oldPic.png"});
    o.company3 = await Company.create({email: "company3@old.com", name: "oldName", description: "Old description", password: hashed, picture: "oldPic.png"});
    o.company4 = await Company.create({email: "company4@old.com", name: "oldName", description: "Old description", password: hashed, picture: "oldPic.png"});
    o.apiCompany1 = await Company.create({email: "apicompany1@old.com", name: "oldName", description: "Old description", password: hashed, picture: "oldPic.png"});
    o.apiCompany2 = await Company.create({email: "apicompany2@old.com", name: "oldName", description: "Old description", password: hashed, picture: "oldPic.png"});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

//unit test
test('Company can change all the information', async function() {
    const { company } = o;
    const ctx = {request: { body: {name: 'newName', description: 'New description', email: 'company@new.com', password: 'newPassword', picture: 'newPic.png'} }, user: company};
    await update(ctx, noop);
    await company.reload();

    expect(company.id).toBeGreaterThan(0);
    expect(company.name).toBe('newName');
    expect(company.description).toBe('New description');
    expect(company.email).toBe('company@new.com');
    expect(company.picture).toBe('newPic.png');
    const comparePassword = await compare('newPassword', company.password);
    expect(comparePassword).toBe(true);
  });

  test('Company can change only the name', async function() {
    const { company2 } = o;
    const ctx = {request: { body: {name: 'newName' } }, user: company2};
    await update(ctx, noop);
    await company2.reload();

    expect(company2.id).toBeGreaterThan(0);
    expect(company2.name).toBe('newName');
    expect(company2.description).toBe('Old description');
    expect(company2.email).toBe('company2@old.com');
    expect(company2.picture).toBe('oldPic.png');
    const comparePassword = await compare('oldPassword', company2.password);
    expect(comparePassword).toBe(true);
  });

  test('Company can change only the email', async function() {
    const { company3 } = o;
    const ctx = {request: { body: {email: 'company3@newest.com' } }, user: company3};
    await update(ctx, noop);
    await company3.reload();

    expect(company3.id).toBeGreaterThan(0);
    expect(company3.name).toBe('oldName');
    expect(company3.description).toBe('Old description');
    expect(company3.email).toBe('company3@newest.com');
    expect(company3.picture).toBe('oldPic.png');
    const comparePassword = await compare('oldPassword', company3.password);
    expect(comparePassword).toBe(true);
  });

  test('Company can not change to an already used email', async function() {
    const { company3, companyThatAlreadyExists } = o;
    const ctx = {request: { body: {email: companyThatAlreadyExists.email } }, user: company3};
    try{
      await update(ctx, noop);
    }catch(e){
        expect(e.status).toBe(400);
        expect(e.message).toBe("This email is already taken.");
    }
  });

  test('Company can change only the password', async function() {
    const { company4 } = o;
    const ctx = {request: { body: {password: 'newPassword' } }, user: company4};
    await update(ctx, noop);
    await company4.reload();

    expect(company4.id).toBeGreaterThan(0);
    expect(company4.name).toBe('oldName');
    expect(company4.description).toBe('Old description');
    expect(company4.email).toBe('company4@old.com');
    expect(company4.picture).toBe('oldPic.png');
    const comparePassword = await compare('newPassword', company4.password);
    expect(comparePassword).toBe(true);
  });

  //api test
  test("Company can change all the information - API version", async function (){
    const { apiCompany1 } = o;
    const jwt = signJWT({id: apiCompany1.id, userType: "company"});
    const url = `http://localhost:3000/api/v1/company/profile`;
    const response = await r2.post(url, {json:{email: 'apicompany1@new.com', name: 'newName', password: 'newPassword', description: 'New description', picture: 'newPic.png'}, headers: {authorization: "Bearer " + jwt}}).response;
    await apiCompany1.reload();
    expect(response.status).toBe(200);
    expect(apiCompany1.id).toBeGreaterThan(0);
    expect(apiCompany1.name).toBe('newName');
    expect(apiCompany1.description).toBe('New description');
    expect(apiCompany1.email).toBe('apicompany1@new.com');
    expect(apiCompany1.picture).toBe('newPic.png');
    const comparePassword = await compare('newPassword', apiCompany1.password);
    expect(comparePassword).toBe(true);
  });

  test("Company can change only the name - API version", async function (){
    const { apiCompany2 } = o;
    const jwt = signJWT({id: apiCompany2.id, userType: "company"});
    const url = `http://localhost:3000/api/v1/company/profile`;
    const response = await r2.post(url, {json:{name: 'newName'}, headers: {authorization: "Bearer " + jwt}}).response;
    await apiCompany2.reload();
    expect(response.status).toBe(200);
    expect(apiCompany2.id).toBeGreaterThan(0);
    expect(apiCompany2.name).toBe('newName');
    expect(apiCompany2.description).toBe('Old description');
    expect(apiCompany2.email).toBe('apicompany2@old.com');
    expect(apiCompany2.picture).toBe('oldPic.png');
    const comparePassword = await compare('oldPassword', apiCompany2.password);
    expect(comparePassword).toBe(true);
  });

  test("Company can not change to an already used email - API version", async function (){
    const { apiCompany2 } = o;
    const jwt = signJWT({id: apiCompany2.id, userType: "company"});
    const url = `http://localhost:3000/api/v1/company/profile`;
    const response = await r2.post(url, {json:{email: 'apicompany1@new.com'}, headers: {authorization: "Bearer " + jwt}}).response;
    await apiCompany2.reload();
    expect(response.status).toBe(400);
    expect(apiCompany2.email).toBe('apicompany2@old.com');
  });