// $ ALGOLIA_APP_ID="XXXXX" ALGOLIA_API_KEY="YYYYY" npx jest test/3rd-party/algoliasearch.test.js

describe('Algolia search wrapper', () => {
  let searchModel;

  // init with provided credentials
  beforeAll(() => {
    expect(process.env).toHaveProperty('ALGOLIA_APP_ID');
    expect(process.env).toHaveProperty('ALGOLIA_API_KEY');
    process.appParams = { searchModule: 'searchAlgolia' };
    searchModel = require('../../app/models/search.js');
  });

  it('should index a post', () => {
    const result = searchModel.indexTyped('post', {
      _id: 'xyz',
      name: 'a post',
    });
    console.log({ result });
  });
});
