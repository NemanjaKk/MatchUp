const FormData = require('form-data');
const {  Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');
const fs = require("fs");
const fetch = require('node-fetch');
const path = require("path");
const md5 = require("md5");
const { imageUpload } = require('../../api/companies/company.controller');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.company = await Company.create({email: "change@profilePicture.com", name: "Company Kitten"});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

test("No file uploaded in API", async () => {
  const { company } = o;
  const ctx = { user: company };
  try{
    await imageUpload(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBe("No image in the upload");
  }
});

test("Company can change its profile picture", async () => {
  const { company } = o;
  const newProfilePicture = "https://myprofilepicture.com/hello.png";
  const ctx = { user: company, file: { location: newProfilePicture } };
  await imageUpload(ctx);
  expect(ctx.status).toBe(200);
  expect(ctx.body.picture).toBe(newProfilePicture);
  await company.reload();
  expect(company.picture).toBe(newProfilePicture);
})

test("Company can change its profile picture - API version", async () => {
  const { company } = o;
  const jwt = signJWT({id: company.id, userType: "company"});
  const url = "http://localhost:3000/api/v1/company/imageUpload";

  const form = new FormData();
  const kittenPath = path.join(__dirname, "kitten.jpeg");
  form.append("image", fs.createReadStream(kittenPath));
  const res = await fetch(url, { body: form, method: "POST", headers: {"Authorization": "Bearer " + jwt} });

  expect(res.status).toBe(200);
  const json = await res.json();
  await company.reload();
  const picture = json.picture;
  expect(picture).toBeDefined();
  expect(picture).toBe(company.picture);

  const response = await fetch(picture);
  expect(response.ok).toBe(true);
  const remoteKitten = await streamToString(response.body);
  const localKitten = await fs.readFileSync(kittenPath, 'utf-8');
  const hash1 = md5(remoteKitten);
  const hash2 = md5(localKitten);
  expect(hash1).toBe(hash2);
});

function streamToString (stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}