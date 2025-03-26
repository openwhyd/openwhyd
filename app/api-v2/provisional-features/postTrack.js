// @ts-check

const config = require('../../models/config.js');
const postModel = require('../../models/post.js');

/**
 * @type {import('../../domain/api/Features.js').PostTrack}
 */
async function postTrack(user, postTrackRequest) {
  // extract the youtube video id from the URL
  const eId = config.translateUrlToEid(postTrackRequest.url);
  if (!eId || !eId.startsWith('/yt/'))
    throw new Error(`unsupported url: ${postTrackRequest.url}`);
  console.log(`/api/v2/postTrack, embed id: ${eId}`);

  // create document to be stored in DB
  const postDocument = {
    uId: user.id,
    uNm: user.name,
    eId,
    name: postTrackRequest.title,
    img: postTrackRequest.thumbnail,
    text: postTrackRequest.description,
  };
  console.log(`/api/v2/postTrack doc:`, JSON.stringify(postDocument));

  // store the post in DB + search index
  const posted = await new Promise((resolve, reject) =>
    postModel.savePost(postDocument, (res) =>
      res
        ? resolve(res)
        : reject(new Error('failed to post the track in database')),
    ),
  );
  return { url: `${process.env.WHYD_URL_PREFIX}/c/${posted._id}` };
}

exports.postTrack = postTrack;
