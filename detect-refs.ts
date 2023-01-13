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

const findPropertyAssignedFunction = (
  ref: tsmorph.Node
): NamedNodeWithReferences | undefined => {
  const anonymousFct = ref.getFirstAncestor(tsmorph.Node.isBodied);
  if (anonymousFct) {
    const potentialAssignment = anonymousFct.getFirstAncestorByKind(
      tsmorph.SyntaxKind.PropertyAssignment
    );
    if (
      tsmorph.Node.isReferenceFindable<tsmorph.Node>(potentialAssignment) &&
      tsmorph.Node.hasName(potentialAssignment)
      // && potentialAssignment.getRight() === anonymousFct
    ) {
      return potentialAssignment;
    }
  }
};

// const findAnonymousFunction = (
//   ref: tsmorph.Node
// ): NamedNodeWithReferences | undefined => {
//   const anonymousFct = ref.getFirstAncestor(tsmorph.Node.isBodied);
//   const fct = anonymousFct?.getFirstAncestorByKind(
//     tsmorph.SyntaxKind.FunctionExpression
//   );
//   if (fct && tsmorph.Node.isReferenceFindable<tsmorph.Node>(anonymousFct)) {
//     return {
//       ...fct,
//       getName() {
//         return '[anonymous function]';
//       },
//     };
//   }
// };

const findParentFunction = (
  ref: tsmorph.Node
): NamedNodeWithReferences | undefined => {
  return (
    ref.getFirstAncestor(isNamedFunction) ??
    findAssignedFunction(ref) ??
    findPropertyAssignedFunction(ref)
    // ?? findAnonymousFunction(ref)
  );
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

type Reference = { node: tsmorph.Node; refs: Reference[] };

// to de-duplicate refs, i.e. when a given node was referenced more than once by a referrer
const browsedNodes = new (class {
  private alreadyBrowsed = new Set<tsmorph.Node>();
  dedup(...nodes: tsmorph.Node[]) {
    const newNodes = nodes.filter((node) => !this.alreadyBrowsed.has(node));
    newNodes.forEach((node) => this.alreadyBrowsed.add(node));
    return newNodes;
  }
})();

const buildRefsSubTree = (node: tsmorph.Node): Reference[] => {
  const referrer = findParentFunction(node);
  if (referrer?.getSymbol() === node.getSymbol()) {
    console.warn(`🔃 skipping recursive call on ${node.getText()}`);
  } else if (referrer) {
    const newNodes = browsedNodes.dedup(...referrer.findReferencesAsNodes());
    return newNodes.map((ref) => ({
      node: ref,
      refs: buildRefsSubTree(ref),
    }));
    // TODO: exclude assignments to the "node"
  }
  return [];
};

const allRefs: Reference[] = [
  ...refs.map((ref) => ({ node: ref, refs: buildRefsSubTree(ref) })),
];

const renderReference = (ref: Reference, depth = 0) => {
  const filePath = ref.node
    .getSourceFile()
    .getFilePath()
    .replace(__dirname, '');
  const lineNumber = ref.node.getStartLineNumber();
  const callee = ref.node.getText();
  const parentFct = findParentFunction(ref.node);
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
  console.log(
    `${' '.repeat(
      depth
    )}${filePath}:${lineNumber}, ${callee} referenced by ${referrer}`
  );
  ref.refs.forEach((subRef) => renderReference(subRef, depth + 1));
};

allRefs.forEach((ref) => renderReference(ref));
