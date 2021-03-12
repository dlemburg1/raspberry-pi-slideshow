const Bluebird = require("bluebird");
const SOURCE_MAP = require("./sources");

const processSources = async ({ name, source: Source }) => {
  const { rawData: _, data } = await Source.fetchAndTransform();
  await Source.processData(data);
  await Source.persist(data);
};

const batchProcessSources = (sources) =>
  Bluebird.each(sources, ([sourceName, sourceHandler]) =>
    processSources({ name: sourceName, source: sourceHandler })
  );

(async function main() {
  try {
    await batchProcessSources(Object.entries(SOURCE_MAP));
  } catch (err) {
    console.log({ err });
  }
})();
