exports.Buffer = class Buffer {
  constructor(arg) {
    // Buffer.call(this, arg);
    this.position = 0;
  }

  append(data) {
    var nbWritten;
    if (typeof data === 'string') nbWritten = this.write(data, this.position);
    else if (Buffer.isBuffer(data)) nbWritten = data.copy(this, this.position);
    else
      throw new TyperError(
        'my.util.AppendBuffer.append: <data> must be a string or buffer'
      );
    this.position += nbWritten;
  }

  clear() {
    this.position = 0;
  }

  getRemaining() {
    return this.length - this.position;
  }

  sliceData() {
    return this.slice(0, this.position);
  }

  toString() {
    return this.sliceData().toString();
  }
};
