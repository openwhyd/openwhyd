import { bench, describe } from 'vitest';

const snip = require('../app/snip.js');

describe('snip.js utilities', () => {
  describe('arrayToSet', () => {
    const smallArray = ['a', 'b', 'c', 'd', 'e'];
    const largeArray = Array.from({ length: 1000 }, (_, i) => `item_${i}`);

    bench('small array (5 items)', () => {
      snip.arrayToSet(smallArray);
    });

    bench('large array (1000 items)', () => {
      snip.arrayToSet(largeArray);
    });
  });

  describe('sanitizePaginationParams', () => {
    bench('valid params', () => {
      snip.sanitizePaginationParams({ skip: 10, limit: 20 });
    });

    bench('string params', () => {
      snip.sanitizePaginationParams({ skip: '10', limit: '20' });
    });

    bench('empty params', () => {
      snip.sanitizePaginationParams({});
    });
  });

  describe('translateFields', () => {
    bench('translate single field', () => {
      snip.translateFields({ a: 1, b: 2, c: 3 }, { b: 'bb' });
    });
  });

  describe('htmlEntities', () => {
    bench('short string', () => {
      snip.htmlEntities('<script>alert("xss")</script>');
    });

    bench('long string with special chars', () => {
      snip.htmlEntities(
        '<div class="container">&amp; some "text" with <tags> & entities</div>'.repeat(
          10,
        ),
      );
    });
  });

  describe('removeAccents', () => {
    bench('string with accents', () => {
      snip.removeAccents('àéîöù crème brûlée café résumé');
    });

    bench('string without accents', () => {
      snip.removeAccents('hello world this is a test string');
    });
  });

  describe('formatEmail', () => {
    bench('valid email', () => {
      snip.formatEmail('user@example.com');
    });
  });

  describe('extractMentions', () => {
    bench('text with mentions', () => {
      snip.extractMentions(
        'Hello @[John](user:123) and @[Jane](user:456), check this out!',
      );
    });

    bench('text without mentions', () => {
      snip.extractMentions('Just a regular comment with no mentions at all.');
    });
  });

  describe('renderTimestamp', () => {
    bench('seconds', () => {
      snip.renderTimestamp(45000);
    });

    bench('hours', () => {
      snip.renderTimestamp(7200000);
    });

    bench('days', () => {
      snip.renderTimestamp(172800000);
    });
  });
});
