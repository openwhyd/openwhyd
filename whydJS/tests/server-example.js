var get = require('get');

get('http://openwhyd.org', function(err, page) {
  if (err) {
    console.log(err);
  } else {
    console.log(page.getTitle());
    console.log(page.getImages());
  }
});