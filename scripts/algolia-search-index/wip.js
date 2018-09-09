/*
  if (u != null) {
    ++fetched;
    process(u, function(){
      if (fetched % 100 == 0)
        console.warn("=> last (BULK) indexed document: ", u._id);
      setTimeout(next);
    });
  }
  else {
    flush(function(){
      console.log("admin.index.refreshIndex DONE! => indexed", indexed, "documents from", fetched, 'fetched db records');
      cb && cb();
    });
  }
  */

/*
const series = promises => new Promise((resolve, reject) =>{
  const results = [];
  return promises.reduce((p, fn) => {
    console.log('reduce', typeof p, p, typeof fn, fn)
    if (!p) return resolve(results);
    return p.then(res => {
      console.log('then', res, typeof p, p, typeof fn, fn)
      results.push(res);
      return p.then(fn);
    })
  }, Promise.resolve())
});
*/

//const series = promises => promises.reduce((p, fn) => p.then(fn), Promise.resolve());
