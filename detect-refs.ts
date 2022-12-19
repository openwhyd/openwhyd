// This script lists all references to `snip.values`.
//
// Usage: $ npx tsx detect-refs.ts

import * as tsmorph from 'ts-morph';

const isFunction = (node: tsmorph.Node): node is tsmorph.FunctionDeclaration =>
  node instanceof tsmorph.FunctionDeclaration; // note: this only works if the `function` keyword was used

const findParentFunction = (ref: tsmorph.Node) => {
  let node: tsmorph.Node | undefined = ref;
  while (node && !isFunction(node)) {
    node = node.getParent();
  }
  return node;
};

const tsConfigFilePath = './tsconfig.json';
const targetFile = './app/snip.js';
const targetIdentifier = 'values';

const identifierDeclaration = new tsmorph.Project({ tsConfigFilePath })
  .getSourceFile(targetFile)
  ?.getDescendantsOfKind(tsmorph.SyntaxKind.Identifier)
  .find((desc) => desc.getText() === targetIdentifier);

// console.log(identifierDeclaration?.getParent().getText()); // => exports.values
// console.log(identifierDeclaration?.getParent().getKindName()); // => PropertyAccessExpression
// console.log(identifierDeclaration?.getParent()?.getParent()?.getKindName()); // => BinaryExpression
// console.log(identifierDeclaration?.getParent()?.getParent()?.getParent()?.getKindName()); // => ExpressionStatement

const refs = identifierDeclaration?.findReferencesAsNodes() || [];

const allRefs = [...refs];

for (const directRef of allRefs) {
  const caller = findParentFunction(directRef);
  if (caller) allRefs.push(...caller.findReferencesAsNodes());
}

const renderReference = (ref: tsmorph.Node) => {
  const filePath = ref.getSourceFile().getFilePath();
  const lineNumber = ref.getStartLineNumber();
  const caller = findParentFunction(ref)?.getName() ?? '[top level]';
  return `${filePath}:${lineNumber}, called by ${caller}`;
};

allRefs.forEach((ref) => console.log(renderReference(ref)));
