// usage:
// 1. $ mongoexport -d ${dbname} -c user --type=json --out ./prod-users.json-lines -u ${dbuser} -p ${dbpassword}
// 2. $ node ./scripts/auth0/prepare-import-batches.js
// 3. $ ./import-prod-users.sh

const fs = require('fs');
const readline = require('readline');

// Replace 'your-text-file.txt' with the path to your text file
const inputFile = 'prod-users.json-lines';
const outputFile = 'prod-users-NUMBER.for-auth0.json';
const MAX_BYTES_PER_BATCH = 498 * 1000; // ≤ 500KB, file size limit for a bulk import

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

let currentBatchNumber = 0;
let currentBatchBytes = 0;
let currentBatchUsers = [];

async function* readLinesGenerator(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of rl) {
      yield line;
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

// Create the generator
const linesGenerator = readLinesGenerator(inputFile);

// Use the generator to retrieve lines
(async () => {
  try {
    for await (const line of linesGenerator) {
      const user = JSON.parse(line);
      if (
        currentBatchBytes +
          Buffer.byteLength(JSON.stringify(user), 'utf8') +
          1 >=
        MAX_BYTES_PER_BATCH
      ) {
        await dumpCurrentBatch();
        currentBatchUsers = [];
      }
      currentBatchUsers.push(convertUser(user));
      currentBatchBytes = Buffer.byteLength(
        JSON.stringify(currentBatchUsers),
        'utf8',
      );
    }

    await dumpCurrentBatch();
    console.warn(`✅ done`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();

async function dumpCurrentBatch() {
  const filename = outputFile.replace('NUMBER', currentBatchNumber);
  ++currentBatchNumber;
  await fs.promises.writeFile(filename, JSON.stringify(currentBatchUsers));
  console.warn(`🟢 wrote ${filename}`);
}
