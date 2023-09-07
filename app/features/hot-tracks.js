// @ts-check

const FIELDS_TO_SUM = {
  nbP: true, // number of plays
  nbL: true, // number of likes (from lov[] field)
  nbR: true, // number of posts/reposts
};

exports.FIELDS_TO_SUM = FIELDS_TO_SUM;

const FIELDS_TO_COPY = {
  name: true,
  img: true,
  score: true,
};

exports.FIELDS_TO_COPY = FIELDS_TO_COPY;

/**
 * @param {() => Promise<{pId: string, eId: string}[]>} getTracksByDescendingScore (partial type definition, just to check usage of objArrayToValueArray)
 */
exports.getHotTracks = async function (getTracksByDescendingScore) {
  return await getTracksByDescendingScore();
};
