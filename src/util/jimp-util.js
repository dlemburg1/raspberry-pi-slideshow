const Jimp = require("jimp");
const Bluebird = require("bluebird");

const writeTextOnImage = async ({ url, text, x = 10, y = 10 }) => {
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const image = await Jimp.read(url);
  const newImage = await image.print(font, x, y, text);
  newImage.write(url);
};

const batchWriteTextOnImages = (images) => {
  return Bluebird.map(images, writeTextOnImage);
};

module.exports = { writeTextOnImage, batchWriteTextOnImages };
