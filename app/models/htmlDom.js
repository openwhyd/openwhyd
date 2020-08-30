/**
 * simple html parser with dom traversal methods
 */

var htmlparser = require('htmlparser');

// returns the <html> node, as a SimpleDomNode instance
exports.parseDom = function (dom) {
  function SimpleDomNode(node) {
    this.node = node;
  }
  SimpleDomNode.prototype.getFirstElementByTagName = function (tagName) {
    var nodes = this.node.children || this.node;
    for (let i in nodes)
      if (nodes[i].name == tagName) return new SimpleDomNode(nodes[i]);
  };
  SimpleDomNode.prototype.getText = function () {
    var results = [];
    if (this.node.type == 'text') {
      results.push(this.node.data);
    }
    if (this.node.children)
      this.node.children.map(function (child) {
        results = results.concat(new SimpleDomNode(child).getText());
      });
    return results.join(' ');
  };
  SimpleDomNode.prototype.getChildren = function () {
    return this.node.children.map(function (child) {
      return new SimpleDomNode(child);
    });
  };
  SimpleDomNode.prototype.getElementsByTagName = function (tagName) {
    var results = [];
    var nodes = this.node.children;
    for (let i in nodes) {
      var node = new SimpleDomNode(nodes[i]);
      if (nodes[i].name == tagName) results.push(node);
      if (nodes[i].children)
        results = results.concat(node.getElementsByTagName(tagName));
    }
    return results;
  };
  SimpleDomNode.prototype.getElementsByClassName = function (className) {
    var nodeHasClass = (function (className) {
      return function (node) {
        var classNames = (node.attribs || {}).class;
        return classNames && (' ' + classNames + ' ').indexOf(className) > -1;
      };
    })(' ' + className + ' ');
    var results = [];
    var nodes = this.node.children;
    for (let i in nodes) {
      var node = new SimpleDomNode(nodes[i]);
      if (nodeHasClass(nodes[i])) results.push(node);
      if (nodes[i].children)
        results = results.concat(node.getElementsByClassName(className));
    }
    return results;
  };
  return new SimpleDomNode(dom).getFirstElementByTagName('html');
};

exports.parseHtmlDom = function (html, cb) {
  var parser = new htmlparser.Parser(
    new htmlparser.DefaultHandler(function (error, dom) {
      if (error) {
        console.error(error);
        cb({ error: error });
      } else cb(exports.parseDom(dom));
    })
  );
  parser.parseComplete(html);
};
