// This script lists all references to `snip.values`.
//
// Usage:   $ npx tsx detect-refs.ts <file> <identifier>
//
// Example: $ npx tsx detect-refs.ts app/snip.js values

import * as tsmorph from 'ts-morph';

const isNamedFunction = (
  node: tsmorph.Node
): node is tsmorph.FunctionDeclaration =>
  node instanceof tsmorph.FunctionDeclaration; // only works if the `function` keyword is used

type NamedNodeWithReferences = tsmorph.ReferenceFindableNode &
  tsmorph.Node & { getName(): string };

const findAssignedFunction = (
  ref: tsmorph.Node
): NamedNodeWithReferences | undefined => {
  const anonymousFct = ref.getFirstAncestor(tsmorph.Node.isBodied);
  if (anonymousFct) {
    const potentialAssignment = anonymousFct.getFirstAncestorByKind(
      tsmorph.SyntaxKind.BinaryExpression
    );
    const operator = potentialAssignment?.getOperatorToken();
    const potentialIdentifier = potentialAssignment?.getLeft();
    if (
      operator?.isKind(tsmorph.SyntaxKind.EqualsToken) &&
      tsmorph.Node.isReferenceFindable<tsmorph.Node>(potentialIdentifier) &&
      tsmorph.Node.hasName(potentialIdentifier)
      // && potentialAssignment.getRight() === anonymousFct
    ) {
      return potentialIdentifier;
    }
  }
};

const findParentFunction = (
  ref: tsmorph.Node
): NamedNodeWithReferences | undefined => {
  const namedFct = ref.getFirstAncestor(isNamedFunction);
  return namedFct ?? findAssignedFunction(ref);
};

// const printParents = (ref: tsmorph.Node) => {
//   let node: tsmorph.Node | undefined = ref;
//   while (node) {
//     if (node.getParent()) {
//       console.warn(node.getKindName(), isFunction(node), node.getText());
//     }
//     node = node.getParent();
//   }
//   return null;
// };

const tsConfigFilePath = './tsconfig.json';
const targetFile = process.argv[2];
const targetIdentifier = process.argv[3];

const identifierDeclaration = new tsmorph.Project({ tsConfigFilePath })
  .getSourceFile(targetFile)
  ?.getDescendantsOfKind(tsmorph.SyntaxKind.Identifier)
  .find((desc) => desc.getText() === targetIdentifier);

const refs = identifierDeclaration?.findReferencesAsNodes() || [];

const allRefs = [...refs];

const alreadyBrowsed = new Set<tsmorph.Node>(); // to de-duplicate refs, i.e. when a given node was referenced more than once by a referrer

for (const node of allRefs) {
  if (alreadyBrowsed.has(node)) continue;
  else alreadyBrowsed.add(node);
  const referrer = findParentFunction(node);
  if (referrer?.getSymbol() === node.getSymbol()) {
    console.warn(`🔃 skipping recursive call on ${node.getText()}`);
  } else if (referrer) {
    allRefs.push(...referrer.findReferencesAsNodes());
    // TODO: exclude assignments to the "node"
  }
}

const renderReference = (ref: tsmorph.Node) => {
  const filePath = ref.getSourceFile().getFilePath().replace(__dirname, '');
  const lineNumber = ref.getStartLineNumber();
  const callee = ref.getText();
  const parentFct = findParentFunction(ref);
  // const ancestorText = ref
  //   ?.getParent()
  //   ?.getParent()
  //   ?.getParent()
  //   ?.getParent()
  //   ?.getParent()
  //   ?.getParent()
  //   ?.getText();
  // if (ancestorText?.includes(`return exports.usernames['' + uid];`)) {
  //   console.warn(ancestorText);
  //   printParents(ref);
  // }
  const referrer = parentFct
    ? parentFct.getName() ?? '[anonymous function]'
    : '[top level]';
  return `${filePath}:${lineNumber}, ${callee} referenced by ${referrer}`;
};

allRefs.forEach((ref) => console.log(renderReference(ref)));
