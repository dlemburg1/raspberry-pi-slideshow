const database = require("./database.json");
const fs = require("fs");

const update = (src, data = {}) => {
  database[src].lastUpdated = new Date();
  database[src].data = data;

  fs.writeFileSync("src/data/database.json", JSON.stringify(database), "utf8");

  return database;
};

module.exports = { update };
