// This script lists all references to `mongodb.usernames`.
//
// Usage: $ npx tsx detect-refs.ts

import * as tsmorph from 'ts-morph';

const tsConfigFilePath = './tsconfig.json';
const targetFile = './app/models/mongodb.js';
const targetIdentifier = 'usernames';

const identifierDeclaration = new tsmorph.Project({ tsConfigFilePath })
  .getSourceFile(targetFile)
  .getDescendantsOfKind(tsmorph.SyntaxKind.Identifier)
  .find((desc) => desc.getText() === targetIdentifier);

// console.log(identifierDeclaration.getParent().getText()); // => exports.usernames
// console.log(identifierDeclaration.getParent().getKindName()); // => PropertyAccessExpression
// console.log(identifierDeclaration.getParent().getParent().getKindName()); // => BinaryExpression
// console.log(identifierDeclaration.getParent().getParent().getParent().getKindName()); // => ExpressionStatement

const refs = identifierDeclaration?.findReferencesAsNodes() || [];

const renderReference = (ref: tsmorph.Node) => {
  const filePath = ref.getSourceFile().getFilePath();
  const lineNumber = ref.getStartLineNumber();
  return `${filePath}:${lineNumber}`;
};

refs.forEach((ref) => console.log(renderReference(ref)));
