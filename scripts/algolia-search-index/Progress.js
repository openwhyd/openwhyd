module.exports = class Progress {
  constructor({ label, intervalMs = 1000, max }) {
    this.count = 0;
    this.label = label;
    console.log(`( ${this.label} )`);
    this.interval = setInterval(() => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(
        `( ${this.label} ${this.count} ${max ? `/ ${max}` : ''} )`
      );
    }, intervalMs);
  }
  done() {
    clearInterval(this.interval);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  }
  incr() {
    ++this.count;
  }
};
