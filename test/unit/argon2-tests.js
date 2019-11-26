const assert = require('assert');
const argon2 = require('argon2');

describe('argon2', function() {
  it('should cypher a secret', async () => {
    const hash = await argon2.hash('password');
    const hex = hash.toString('hex');
    assert(hex);
  });

  it('should generate the same hash, given a same salt', async () => {
    const password = 'secret';
    const hash = await argon2.hash(password);
    const valid = await argon2.verify(hash, password);
    assert(valid);
  });

  it('should not generate the same hash, given a different salt', async () => {
    const password = 'secret';
    const hash = await argon2.hash(password);
    const hash2 = await argon2.hash(password, {
      salt: Buffer.from('1234567890abcdef')
    });
    assert.notEqual(hash.toString('hex'), hash2.toString('hex'));
  });
});
