// To transpile TypeScript files into bookmarklet.js, run:
// $ scripts/transpile-bookmarklet.sh
//
// Then, run tests:
// $ npx mocha test/unit/bookmarklet-tests.js && \
//   . ./.env-docker && npx cypress run --spec cypress/integration/bookmarklet.spec.ts
import './bookmarkletLogic';
import './bookmarkletYouTube';
import './bookmarkletUI';
