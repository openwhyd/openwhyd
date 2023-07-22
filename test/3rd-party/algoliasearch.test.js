// $ ALGOLIA_APP_ID="XXXXX" ALGOLIA_API_KEY="YYYYY" npx jest test/3rd-party/algoliasearch.test.js

const util = require('util');

describe('Algolia search wrapper', () => {
  let searchModel;

  // init with provided credentials
  beforeAll(() => {
    expect(process.env).toHaveProperty('ALGOLIA_APP_ID');
    expect(process.env).toHaveProperty('ALGOLIA_API_KEY');
    process.appParams = { searchModule: 'searchAlgolia' };
    searchModel = require('../../app/models/search.js');
  });

  it('should fail to index a post if name is missing', async () => {
    const promise = util.promisify(searchModel.indexTyped)('post', {
      _id: 'xyz',
    });
    await expect(promise).rejects.toThrow('indexTyped: missing parameters');
  });

  it('should index a post', async () => {
    const result = await util.promisify(searchModel.indexTyped)('post', {
      _id: 'xyz',
      name: 'a post',
    });

    console.log({ result });
  });
});
