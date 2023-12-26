// usage:
// 1. $ mongoexport -d ${dbname} -c user --type=json --out ./prod-users.json-lines -u ${dbuser} -p ${dbpassword}
// 2. $ node ./scripts/auth0/prepare-import-batches.js
// 3. $ ./import-prod-users.sh

const fs = require('fs');
const readline = require('readline');

// Replace 'your-text-file.txt' with the path to your text file
const inputFile = 'prod-users.json-lines';
const outputFile = 'prod-users.for-auth0.json';

const convertUser = (user) => ({
  user_id: user._id.$oid,
  email: user.email,
  username: user.handle,
  name: user.name,
  custom_password_hash: {
    algorithm: 'md5',
    hash: {
      encoding: 'hex',
      value: user.pwd,
    },
  },
});

const users = [];

// Create a readable stream from the text file
const fileStream = fs.createReadStream(inputFile);

// Create a readline interface
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity, // Recognize all instances of CR LF ('\r\n') as end-of-line input
});

rl.on('line', (line) => {
  const user = JSON.parse(line);
  users.push(convertUser(user));
});

// Event listener for the end of the file
rl.on('close', () => {
  fs.promises
    .writeFile(outputFile, JSON.stringify(users))
    .then(() => console.warn(`✅ done: wrote ${outputFile}`));
});

// Event listener for errors
rl.on('error', (err) => {
  console.error('❌ Error:', err);
});

// TODO: The file size limit for a bulk import is 500KB
