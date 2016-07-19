var trackMatcher = require("./app/models/trackMatcher.js");
var tm = trackMatcher.TrackMatcher({artistName:"Adrien",trackTitle:"Joly",duration:1});
console.log(tm.evalConfidence({artistName:"A d r i en",trackTitle:"Jo  l y", duration:-22}));
