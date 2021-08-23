'use strict';

const joi = require('joi');

/**
 * Generate a validation schema using joi to check the type of your environment variables
 */
const envSchema = joi
  .object({
    NODE_ENV: joi.string().allow(['development', 'production', 'test']),
    PORT: joi.number(),
    API_VERSION: joi.number(),
    EMAIL_PASSWORD: joi.string(),
    AWS_SECRET_ACCESS_KEY: joi.string(),
    AWS_SECRET_KEY_ID: joi.string(),
  })
  .unknown()
  .required();

/**
 * Validate the env variables using joi.validate()
 */
const { error, value: envVars } = joi.validate(process.env, envSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  isTest: envVars.NODE_ENV === 'test',
  isDevelopment: envVars.NODE_ENV === 'development',
  server: {
    port: envVars.PORT || 3000,
    apiVersion: envVars.API_VERSION || 'v1',
  },
  jwtSecret: envVars.JWT_SECRET || 'mySuperSecret',
  saltRounds: 7,
  emailPassword: envVars.EMAIL_PASSWORD,
  awsSecretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
  awsSecreyKeyId: envVars.AWS_SECRET_KEY_ID,
};

module.exports = config;
