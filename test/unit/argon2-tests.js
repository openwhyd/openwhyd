// $ npx mocha test/unit/argon2-tests.js

const assert = require('assert');
const argon2 = require('argon2');

describe('argon2', function () {
  it('should hash a password', async () => {
    const hash = await argon2.hash('password');
    const hex = hash.toString('hex');
    assert(hex);
  });

  it('should check if password is valid', async () => {
    const password = 'secret';
    const hash = await argon2.hash(password);
    const valid = await argon2.verify(hash, password);
    assert(valid);
  });

  it('should check if password is invalid', async () => {
    const password = 'secret';
    const hash = await argon2.hash(password);
    const valid = await argon2.verify(hash, 'secret2');
    assert.strictEqual(valid, false);
  });

  it('should not generate the same hash, given a different salt', async () => {
    const password = 'secret';
    const hash = await argon2.hash(password);
    const hash2 = await argon2.hash(password, {
      salt: Buffer.from('1234567890abcdef'),
    });
    assert.notEqual(hash.toString('hex'), hash2.toString('hex'));
  });
});
