require("dotenv").config();

const Twitter = require("twitter");
const Bluebird = require("bluebird");
const JimpUtil = require("../util/jimp-util");
const FileUtil = require("../util/file-util");
const Config = require("../config");
const DatabasePersister = require("../data/index.js");

const { filepath } = Config;
const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  bearer_token: process.env.TWITTER_BEARER_TOKEN,
});

const TWITTER_HANDLE_MAP = {
  GreatGolfHoles: {
    useText: (text) => !!text,
    textSanitizer: (text) => text && text.replace(/https?\S+/, ""),
  },
};

const hasMedia = (entities) =>
  entities && entities.media && entities.media.length;

const fetchOne = (handle, options = {}) => {
  return twitterClient.get("statuses/user_timeline", { screen_name: handle });
};

const fetchAndTransform = async () =>
  Bluebird.reduce(
    Object.entries(TWITTER_HANDLE_MAP),
    async ({ accRawData = [], accData = [] }, [handle, options]) => {
      const fetchedData = await fetchOne(handle);
      const transformedData = await transform(fetchedData, {
        handle,
        ...options,
      });

      return {
        rawData: [...accRawData, ...fetchedData],
        data: [...accData, ...transformedData],
      };
    },
    {}
  );

const transform = async (data, options) =>
  data.map(({ text, created_at: createdAt, id_str: id, entities }) => ({
    id,
    createdAt,
    text: options.textSanitizer(text),
    images: hasMedia(entities)
      ? entities.media
          .filter(({ type }) => type === "photo")
          .map((x, idx) => ({
            id: x.id_str,
            url: x.media_url,
            filename: `twitter:${options.handle}:${
              x.id_str
            }.${x.media_url.slice(x.media_url.length - 3)}`,
            idx,
            originalEntity: x,
          }))
      : [],
    options,
  }));

const persist = async (data) => {
  DatabasePersister.update("twitter");
};

const processData = async (data) => {
  const images = data.reduce(
    (acc, { images, text, options }) => [
      ...acc,
      ...images.map((x) => ({ ...x, text, options })),
    ],
    []
  );

  return Bluebird.each(images, async ({ url, filename, text, options }) => {
    await FileUtil.download({
      url,
      filename,
    });

    if (options.useText(text))
      await JimpUtil.writeTextOnImage({ url: `${filepath}/${filename}`, text });
  });
};

module.exports = { fetchAndTransform, processData, persist };
