var my = require('../');

exports.Element = my.Class({

  constructor: function(tagName, args) {
    var i = 0;
    this.tagName = tagName;
    this.attr = args[0];
    this.children = [];
    if (this.attr.constructor === Object) {
      if (this.attr.style) {
        this.style = this.attr.style;
        delete this.attr.style;
      }      
      i++;
    }
    while (i < args.length)
      this.children.push(args[i++]);
  },

  writeIn: function(res) {    
    var attr = this.attr;
    var style = this.style;   
    res.bufferedWrite('<' + this.tagName);
    for (var prop in attr)
      res.bufferedWrite(' ' + prop + '=\"' + attr[prop] + '\"');
    if (style) {
      res.bufferedWrite(' style="')
      for (var s in style)
        res.bufferedWrite(s + ':' + style[s] + ';');
      res.bufferedWrite('"');
    }
    res.bufferedWrite('>')
    for (var i = 0, child; child = this.children[i]; i++) {
      if (typeof child === 'string')
        res.bufferedWrite(child + ' ');
      else
        child.writeIn(res);
    }    
    res.bufferedWrite('</' + this.tagName + '>');    
  }

});


exports.Page = my.Class({

  constructor: function(args) {
    var options = args[0];
    if (options.constructor === Object) {
      this.title = options.title;
      this.meta = options.meta;
      this.scripts = options.scripts;
      this.styles = options.styles;
    }
    this.children = [];
    for (var i = 1; i < args.length; i++)
      this.children.push(args[i]);
  },

  writeIn: function(res) {
    res.bufferedWrite('<!DOCTYPE html><html><head>');
    if (this.meta)
      for (var h in this.meta)
        res.bufferedWrite('<meta name="' + h + '" content="' + this.meta[h] + '"/>');
    if (this.scripts)
      for (var i = 0; i < this.scripts.length; i++)
        res.bufferedWrite('<script type="text/javascript" src="' + this.scripts[i] + '"></script>');
    if (this.styles)
      for (var i = 0; i < this.styles.length; i++)
        res.bufferedWrite('<link type="text/css" rel="stylesheet" href="' + this.styles[i] + '"/>');
    res.bufferedWrite('<title>' + (this.title || "No title") + '</title>');
    res.bufferedWrite('</head><body style="margin:0px; padding:0px">');
    for (var i = 0, child; child = this.children[i]; i++)
      child.writeIn(res);
    res.bufferedWrite('</body></html>');
  }

});