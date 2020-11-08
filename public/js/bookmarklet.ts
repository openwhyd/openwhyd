/**
 * To transpile TypeScript files into bookmarklet.js, run:
 * $ npx tsc --outFile public/js/bookmarklet.js public/js/bookmarklet*.ts && \
 *   npx prettier public/js/bookmarklet.js --write
 *
 * Then, run tests:
 * $ npx mocha test/unit/bookmarklet-tests.js && \
 *   . ./.env-docker && npx cypress run --spec cypress/integration/bookmarklet.spec.ts
 */

import './bookmarkletLogic';
import './bookmarkletUI';
