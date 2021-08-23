const aws = require('aws-sdk');
const multer = require('@koa/multer');
const multerS3 = require('multer-s3');
const path = require('path');
const config = require('../../config');

aws.config.update({
  secretAccessKey: config.awsSecretAccessKey,
  accessKeyId: config.awsSecreyKeyId,
  region: 'eu-central-1',
});

const s3 = new aws.S3()
 
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'pladat',
    acl:'public-read',
    key: function(req,file,cb){
        cb(null,Date.now().toString()+path.extname(file.originalname))
    }
  })
})

module.exports = upload;

