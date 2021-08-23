/** Gets a javascript Date object and returns it in a format ready to be inserted into the database */
module.exports = date => {
  return date.toISOString().substr(0, 10);
}