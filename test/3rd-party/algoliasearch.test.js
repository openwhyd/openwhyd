// $ ALGOLIA_APP_ID="XXXXX" ALGOLIA_API_KEY="YYYYY" npx jest test/3rd-party/algoliasearch.test.js

const util = require('util');

describe('Algolia search wrapper', () => {
  let searchModel;

  const cleanUp = async () => {
    await util.promisify(searchModel.deleteAllDocs)('post');
  };

  // init with provided credentials + clean up
  beforeAll(async () => {
    expect(process.env).toHaveProperty('ALGOLIA_APP_ID');
    expect(process.env).toHaveProperty('ALGOLIA_API_KEY');
    process.appParams = { searchModule: 'searchAlgolia' };
    searchModel = require('../../app/models/search.js');
    await cleanUp();
  });

  afterAll(async () => {
    await cleanUp();
  });

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
      searchModel.countDocs('post', resolve)
    );
    await expect(count).toBe(0);
  });

  it('should index then find a post', async () => {
    const post = {
      _id: 'xyz',
      name: 'a post',
    };
    const result = await util.promisify(searchModel.indexTyped)('post', post);
    expect(result).toMatchObject({ items: [post] });

    const posts = await new Promise((resolve) =>
      searchModel.query(
        {
          _type: 'post',
          q: '',
        },
        resolve
      )
    );
    expect(posts).toMatchObject({ hits: [post] });
  });
});
