// This script lists all references, direct and indirect, to `mongodb.usernames`.
//
// Usage: $ npx tsx detect-refs.ts

import * as tsmorph from 'ts-morph';

const isFunction = (node: tsmorph.Node): node is tsmorph.FunctionDeclaration =>
  node instanceof tsmorph.FunctionDeclaration; // note: this only works if the `function` keyword was used

const findParentFunction = (
  ref: tsmorph.Node
): tsmorph.FunctionDeclaration | undefined => {
  let node: tsmorph.Node | undefined = ref;
  while (node) {
    if (isFunction(node)) return node;
    node = node.getParent();
  }
  return undefined;
};

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

const directRefs = identifierDeclaration?.findReferencesAsNodes() || [];

// const allRefs = [...directRefs];

// for (const directRef of allRefs) {
//   const caller = findParentFunction(directRef);
//   if (caller) allRefs.push(...caller.findReferencesAsNodes());
// }

const renderReference = (ref: tsmorph.Node) => {
  const filePath = ref.getSourceFile().getFilePath();
  const lineNumber = ref.getStartLineNumber();
  const context = findParentFunction(ref)?.getName() ?? '[top level]';
  return `${filePath}:${lineNumber}, ${context}`;
};

directRefs.forEach((ref) => console.log(renderReference(ref)));
