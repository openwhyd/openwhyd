const fs = require('fs');
const vm = require('vm');
const { emit, mapReduceFromJsonLines } = require('./map-reduce-over-json-lines');

const MONGO_SCRIPT_FILE = process.argv[2];
const JSON_DUMP_FILE = process.argv[3]; // '../playlog_last.json.log';
const LOG_PREFIX = '[mongo shell]';

const script = [
  '(async () => {',
  fs.readFileSync(MONGO_SCRIPT_FILE).toString()
    .replace(/load\([\'\"]([^\)]+)[\'\"]\)/g, (instr, file) => fs.readFileSync(file).toString())
    .replace(/emit\(/g, `return (${emit})(`)
    .replace(/db\.([^\.]+)\.mapReduce\(/g, `await mapReduceFromJsonLines(`),
  '})();',
].join('\n');

const context = {
  module: {}, // to tolerate mentions to module.exports
  mapReduceFromJsonLines: mapReduceFromJsonLines.bind(null, JSON_DUMP_FILE),
  print: console.log,
};

new vm.Script(script).runInContext(vm.createContext(context));
