const Sequelize = require("./db");
const fs = require('fs');
const path = require('path');
const { databaseConfig } = require("../config/components/database.config");
const fillDatabase = require("../utils/fillDatabase.util");

const baseName = path.basename(__filename);
let models = {};
const sequelize = new Sequelize().getInstance();

fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== baseName && file !== 'db.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    models[model.name] = model;
  });

let Student = models['Student'];
let Matching = models['Matching'];
let Job = models['Job'];
let Company = models['Company'];
let Application = models['Application'];
let JobCategory = models['JobCategory'];
let Skill = models['Skill'];
let Country = models['Country'];
let City = models['City'];
let SkillSetReq = models['SkillSetReq'];
let SkillSetOpt = models['SkillSetOpt'];
let StudentSkill = models['StudentSkill'];
let SkillCategory = models['SkillCategory'];
let LevelDescription = models['LevelDescription'];

// associations definition
Student.hasMany(Matching);
Matching.belongsTo(Student);

Job.hasMany(Matching);
Matching.belongsTo(Job);

Student.hasMany(Application);
Application.belongsTo(Student);

Job.hasMany(Application);
Application.belongsTo(Job);

Company.hasMany(Job);
Job.belongsTo(Company);

City.hasMany(Company);
Company.belongsTo(City);

JobCategory.hasMany(Job);
Job.belongsTo(JobCategory);

Country.hasMany(City);
City.belongsTo(Country);

City.hasMany(Job);
Job.belongsTo(City);

City.hasMany(Student);
Student.belongsTo(City);

Skill.belongsToMany(Job, { through: SkillSetReq, as: "requiredSkills" });
Job.belongsToMany(Skill, { through: SkillSetReq, as: "requiredSkills" });

Skill.belongsToMany(Job, { through: SkillSetOpt, as: "optionalSkills" });
Job.belongsToMany(Skill, { through: SkillSetOpt, as: "optionalSkills" });

Student.belongsToMany(Skill, { through: StudentSkill, as: "skills" });
Skill.belongsToMany(Student, { through: StudentSkill, as: "students" });
Student.hasMany(StudentSkill);
StudentSkill.belongsTo(Student);
Skill.hasMany(StudentSkill);
StudentSkill.belongsTo(Skill);

SkillCategory.hasMany(Skill);
Skill.belongsTo(SkillCategory);
SkillCategory.hasMany(LevelDescription);
LevelDescription.belongsTo(SkillCategory);

async function sync() {
  await sequelize.sync({ force: databaseConfig.reset });
  await fillDatabase(models);
}

module.exports = { sync, models }