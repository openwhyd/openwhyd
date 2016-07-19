var my = require('my');

var maxHeight = 300, maxWidth = 300;

exports.view = function(data) {

  console.log("view: m.js");
  console.log(data);
  
  var topic = data.topic;

  return(
  my.page({title: 'Hello World', scripts:["http://code.jquery.com/jquery-latest.js"]},
    /*my.div({id: 'myDiv', style: {height: '800px', border: 'red 1px solid'}},
      'Actor ' + data.name
    ),*/
    my.h1(topic.name),
    tabs(topic.friends),
    gallery2(topic.friends[0].entities, '100%', '300px', '200px', '270px', '30px', '30px')
  )
)}

function tabs(friends)
{
  var tabs = my.div({});
  for (var i = 0; i < friends.length; i++)
    tabs.children.push(my.p(friends[i]));
  return gallery;
}

function gallery(imgUrls, width, height, thumbWidth, thumbHeight, hGap, vGap) {
  
  var galleryStyle = {
    margin: 'auto',
    width: width,
    height: height
  };
  
  var thumbStyle = {
    'margin-top': vGap, 
    'margin-left': hGap,
    'max-width': thumbWidth,
    'max-height': thumbHeight,
    '-moz-box-shadow': '1px 1px 6px #999',
    '-webkit-box-shadow': '1px 1px 6px #999'
  };

  var gallery = my.div({style: galleryStyle});
  for (var i = 0; i < imgUrls.length; i++)
    gallery.children.push(my.img({style: thumbStyle, src: imgUrls[i]}));
  return gallery;
}


function gallery2(imgUrls, width, height, thumbWidth, thumbHeight, hGap, vGap) {

  var galleryStyle = {
    display: 'inline-block',
    width: width,
    height: height
  };

  var thumbDivStyle = {
    display: 'inline-block',
    'margin-top': vGap,
    'margin-left': hGap,
    'width': thumbWidth,
    'height': thumbHeight,
    'text-align': 'center'
  };

  var thumbStyle = {
    'max-width': thumbWidth,
    'max-height': thumbHeight,
    '-moz-box-shadow': '1px 1px 6px #999',
    '-webkit-box-shadow': '1px 1px 6px #999'
  };

  var gallery = my.div({style: galleryStyle});
  for (var i = 0; i < imgUrls.length; i++)
  {
    var imgUrl = "http://img.freebase.com/api/trans/image_thumb"+imgUrls[i].id+"?mode=fit&maxheight="+maxHeight+"&maxwidth="+maxWidth;
    //console.log(imgUrls[i].id);
    gallery.children.push(
      my.div({style: thumbDivStyle},
        my.img({style: thumbStyle, src: imgUrl}
      )
    ));
  }
  return gallery;
  
}
