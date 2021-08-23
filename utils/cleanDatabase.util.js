module.exports = async (o, sequelize) => {
  let promises = [];
  for (let key of Object.keys(o)){
    const obj = o[key];
    if (obj.length){
      for (let x of obj){
        promises.push(x.destroy());
      }
    }else{
      promises.push(obj.destroy());
    }

  }
  await Promise.all(promises);
  await sequelize.close();
}