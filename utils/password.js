const bcrypt = require("bcrypt");
const { saltRounds } = require("../config");

module.exports = {
  /** Takes the password in plain text and hashes it */
  hash: async password => {
    return await bcrypt.hash(password, saltRounds);
  },

  /** takes the plain text password and the hash from the database and returns true if and only if they match */
  compare: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  }
}