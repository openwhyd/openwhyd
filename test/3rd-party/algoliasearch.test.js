// Usage:
// $ ALGOLIA_APP_ID="XXXXX" ALGOLIA_API_KEY="YYYYY" npx jest test/3rd-party/algoliasearch.test.js

const util = require('util');

const CLEANUP_TIMEOUT = 45 * 1000; // override jest timeout, to leave algolia enough time to apply requested changes

const DUMMY_POST = {
  _id: 'xyz',
  name: 'a post',
};

describe('Algolia search wrapper', () => {
  let searchModel;

  const cleanUp = async () => {
    await util.promisify(searchModel.deleteAllDocs)('post');
    await util.promisify(searchModel.deleteAllDocs)('playlist');
    await util.promisify(searchModel.deleteAllDocs)('user');
  };

  // init with provided credentials + clean up
  beforeAll(async function () {
    expect(process.env).toHaveProperty('ALGOLIA_APP_ID');
    expect(process.env).toHaveProperty('ALGOLIA_API_KEY');
    searchModel = require('../../app/models/searchAlgolia.js');
    await cleanUp();
  }, CLEANUP_TIMEOUT);

  afterAll(async function () {
    await cleanUp();
  }, CLEANUP_TIMEOUT);

  it('should fail to delete unknown type of documents', async () => {
    const promise = util.promisify(searchModel.deleteAllDocs)('whatever');
    await expect(promise).rejects.toThrow('invalid type');
  });

  it('should fail to index a post if name is missing', async () => {
    const promise = util.promisify(searchModel.indexTyped)('post', {
      _id: 'xyz',
    });
    await expect(promise).rejects.toThrow('indexTyped: missing parameters');
  });

  it('should count number of documents per index', async () => {
    const count = await new Promise((resolve) =>
      searchModel.countDocs('post', resolve),
    );
    await expect(count).toBe(0);
  });

  it('should hit an indexed post, when searching posts', async () => {
    const post = DUMMY_POST;
    const result = await util.promisify(searchModel.indexTyped)('post', post);
    expect(result).toMatchObject({ items: [post] });

    const posts = await new Promise((resolve) =>
      searchModel.query({ _type: 'post', q: '' }, resolve),
    );
    expect(posts).toMatchObject({ hits: [post] });
  });

  it('should hit an indexed post, when searching all types of documents', async () => {
    const post = DUMMY_POST;
    const result = await util.promisify(searchModel.indexTyped)('post', post);
    expect(result).toMatchObject({ items: [post] });

    const posts = await new Promise((resolve) =>
      searchModel.query({ q: '' }, resolve),
    );
    expect(posts).toMatchObject({ hits: [post] });
  });
});
