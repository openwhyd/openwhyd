var get = require('get');

get('http://whyd.com', function(err, page) {
  if (err) {
    console.log(err);
  } else {
    console.log(page.getTitle());
    console.log(page.getImages());
  }
});