var my = require('../');

exports.Buffer = my.Class(Buffer, {

  constructor: function(arg) {
    Buffer.call(this, arg);
    this.position = 0;
  },

  append: function(data) {
    var nbWritten;
    if (typeof data === 'string')
      nbWritten = this.write(data, this.position);
    else if (Buffer.isBuffer(data))
      nbWritten = data.copy(this, this.position);
    else
      throw new TyperError(
        'my.util.AppendBuffer.append: <data> must be a string or buffer');
    this.position += nbWritten;
  },

  clear: function() {
    this.position = 0;
  },

  getRemaining: function() {
    return this.length - this.position;
  },

  sliceData: function() {
    return this.slice(0, this.position);
  },

  toString: function() {
    return this.sliceData().toString();
  }

});
