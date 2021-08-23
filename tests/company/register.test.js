const r2 = require('r2');
const { register } = require('../../api/companies/company.controller');
const { Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const { hash, compare } = require('../../utils/password');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => { };
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};
const email = 'gobig@orgohome.com';

// fill the database
beforeAll(async () => {
    const h = await hash('apritisesamo');
    o.companyAlreadyThere = await Company.create({ name: 'Go big', description: 'or go home', email: email, password: h });
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests 
test('The user must enter an email to register', async function () {

    const ctx = { request: { body: { email: '', password: 'password' } } };
    try {
        await register(ctx, noop);
    } catch (e) {
        expect(e.status).toBe(400);
        expect(e.message).toBeDefined();
    }
});

test('The user must enter a password to register', async function () {

    const ctx = { request: { body: { email: 'provo@aregistrarmi.it', password: '' } } };
    try {
        await register(ctx, noop);
    } catch (e) {
        expect(e.status).toBe(400);
        expect(e.message).toBeDefined();
    }
});

test('The company cannot register if there is a company already registered with the same email', async function () {

    const ctx = { request: { body: { email, password: 'password' } } };
    try {
        await register(ctx, noop);
    } catch (e) {
        expect(e.status).toBe(400);
        expect(e.message).toBeDefined();
    }
});

test('The company is able to register', async function() {
    const email = 'miregistro4@emenevanto.it'
    const ctx = { request: { body: { email: email, password: 'staiSicuro', name: 'Compagnia Bella', description: 'Write a caption' } } };
    await register(ctx, noop);
    o.company = await Company.findOne({ where: { email } });
    expect(o.company).toBeDefined();
    expect(o.company.name).toBe('Compagnia Bella');
    expect(o.company.description).toBe('Write a caption');
});

// api test - test the API with an actual HTTP call
test('The student is able to register - API version', async function() {
    const email = 'mikewazowski1@monstersandcompany.com';
    const url = 'http://localhost:3000/api/v1/company/register/';
    const response = await r2.post(url, { json: { name: 'Monsters & Co.', password: 'MikeWazowski', email, description: 'Creepy' } }).response;
    
    expect(response.status).toBe(201);

    o.companyAPI = await Company.findOne({ where: { email } });
    expect(o.companyAPI).toBeDefined;
    expect(o.companyAPI.email).toBe(email);

    const comparison = await compare('MikeWazowski', o.companyAPI.password);
    expect(comparison).toBe(true);

    expect(o.companyAPI.name).toBe('Monsters & Co.');
    expect(o.companyAPI.description).toBe('Creepy');
});