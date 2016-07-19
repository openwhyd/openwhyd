var my = require('my');

exports.view = function(data) { return(
  my.page({title: 'Hello World', scripts:["http://code.jquery.com/jquery-latest.js"]},
    /*my.div({id: 'myDiv', style: {height: '800px', border: 'red 1px solid'}},
      'Actor ' + data.name
    ),*/
    gallery2(data.imgUrls, '100%', '300px', '200px', '270px', '30px', '30px')
  )
)}



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
    gallery.children.push(
      my.div({style: thumbDivStyle},
        my.img({style: thumbStyle, src: imgUrls[i]}
      )
    ));
  return gallery;
  
}
