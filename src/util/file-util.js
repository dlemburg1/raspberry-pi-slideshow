const request = require("request");
const fs = require("fs");
const Config = require("../config");

const { filepath } = Config;

const download = ({ filename, url }) =>
  new Promise((resolve, reject) => {
    request.head(url, (err, res, body) => {
      request(url)
        .pipe(fs.createWriteStream(`${filepath}/${filename}`))
        .on("close", () => resolve({ url }));
    });
  });

module.exports = { download };
