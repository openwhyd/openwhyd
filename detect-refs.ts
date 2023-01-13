// This script lists all references to `snip.values`.
//
// Usage:   $ npx tsx detect-refs.ts <file> <identifier>
//
// Example: $ npx tsx detect-refs.ts app/snip.js values

import * as tsmorph from 'ts-morph';

const isFunction = (node: tsmorph.Node): node is tsmorph.FunctionDeclaration =>
  node instanceof tsmorph.FunctionDeclaration; // note: this only works if the `function` keyword was used

const findParentFunction = (
  ref: tsmorph.Node
): tsmorph.FunctionDeclaration | null => {
  let node: tsmorph.Node | undefined = ref;
  while (node) {
    if (isFunction(node)) return node;
    node = node.getParent();
  }
  return null;
};

const tsConfigFilePath = './tsconfig.json';
const targetFile = process.argv[2];
const targetIdentifier = process.argv[3];

const identifierDeclaration = new tsmorph.Project({ tsConfigFilePath })
  .getSourceFile(targetFile)
  ?.getDescendantsOfKind(tsmorph.SyntaxKind.Identifier)
  .find((desc) => desc.getText() === targetIdentifier);

const refs = identifierDeclaration?.findReferencesAsNodes() || [];

const allRefs = [...refs];

for (const directRef of allRefs) {
  const caller = findParentFunction(directRef);
  if (caller?.getSymbol() === directRef.getSymbol()) {
    console.warn(`🔃 skipping recursive call on ${directRef.getText()}`);
  } else if (caller) {
    allRefs.push(...caller.findReferencesAsNodes());
  }
}

const renderReference = (ref: tsmorph.Node) => {
  const filePath = ref.getSourceFile().getFilePath().replace(__dirname, '');
  const lineNumber = ref.getStartLineNumber();
  const callee = ref.getText();
  const caller = findParentFunction(ref)?.getName() ?? '[top level]';
  return `${filePath}:${lineNumber}, ${callee} called by ${caller}`;
};

allRefs.forEach((ref) => console.log(renderReference(ref)));
