// @ts-check

/**
 * @param {() => Promise<{pId: string, eId: string}[]>} getTracksByDescendingScore (partial type definition, just to check usage of objArrayToValueArray)
 */
exports.getHotTracks = async function (getTracksByDescendingScore) {
  return await getTracksByDescendingScore();
};
