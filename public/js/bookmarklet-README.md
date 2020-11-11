## Transpile TypeScript files into bookmarklet.js

```sh
$ scripts/transpile-bookmarklet.sh
```

# Run tests

```sh
$ npx mocha test/unit/bookmarklet-tests.js
$ . ./.env-docker && npx cypress run --spec cypress/integration/bookmarklet.spec.ts
```
