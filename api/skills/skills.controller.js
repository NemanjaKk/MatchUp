'use strict';
const { Skill, SkillCategory, LevelDescription } = require("../../models").models;
const { Op } = require("sequelize");

exports.getOne = async ctx => {
  let { skillId } = ctx.params;
  skillId = parseInt(skillId);
  if (!skillId) throw {status: 400, message: 'Invalid skill id'};
  const skill = await Skill.findByPk(skillId, {include: [{model: SkillCategory, include: [{ model: LevelDescription }]}]});
  if (!skill) throw {status: 404, message: 'Skill not found'};
  ctx.body = skill;
}

exports.getAll = async ctx => {
  ctx.body = await Skill.findAll();
  ctx.status = 200;
}


exports.findByCategory = async ctx => {
  let { categoryId } = ctx.params;
  categoryId = parseInt(categoryId);
  if (!categoryId) throw {status: 400, message: 'Invalid category id'};
  const skills = await Skill.findAll({ where: { SkillCategoryId: categoryId } });
  ctx.body = skills;
}

exports.getAllCategories = async ctx => {
  ctx.body = await SkillCategory.findAll({include: [{ model: Skill }]});
}

exports.search = async ctx => {
  const { name } = ctx.params;
  const skills = await Skill.findAll(
    {
      include: [
        { model: SkillCategory,
          include: [{
            model: LevelDescription
          }]
        }],
      where: {
        [Op.or]: [
          { '$Skill.name$': {
              [Op.iLike]: name + '%'
            }},
          { '$SkillCategory.name$': {
              [Op.iLike]: name + '%'
            }
          }]
      }
    });
  ctx.body = skills;
}