// This script lists all references to a given identifier from a given file.
//
// Usage:   $ npx tsx detect-refs.ts <file> <identifier> [top]
//
// Example: $ npx tsx detect-refs.ts app/snip.js values
// Example: $ npx tsx detect-refs.ts app/models/mongodb.js usernames top

import * as tsmorph from 'ts-morph';

const isNamedFunction = (
  node: tsmorph.Node,
): node is tsmorph.FunctionDeclaration =>
  node instanceof tsmorph.FunctionDeclaration; // only works if the `function` keyword is used

type NamedNodeWithReferences = tsmorph.ReferenceFindableNode &
  tsmorph.Node & { getName(): string };

const findAssignedFunction = (
  ref: tsmorph.Node,
): NamedNodeWithReferences | undefined => {
  const anonymousFct = ref.getFirstAncestor(tsmorph.Node.isBodied);
  const potentialAssignment = anonymousFct?.getFirstAncestorByKind(
    tsmorph.SyntaxKind.BinaryExpression,
  );
  const operator = potentialAssignment?.getOperatorToken();
  const potentialIdentifier = potentialAssignment?.getLeft();
  if (
    operator?.isKind(tsmorph.SyntaxKind.EqualsToken) &&
    tsmorph.Node.isReferenceFindable<tsmorph.Node>(potentialIdentifier) &&
    tsmorph.Node.hasName(potentialIdentifier)
  ) {
    return potentialIdentifier;
  }
};

const findPropertyAssignedFunction = (
  ref: tsmorph.Node,
): NamedNodeWithReferences | undefined => {
  const anonymousFct = ref.getFirstAncestor(tsmorph.Node.isBodied);
  const potentialAssignment = anonymousFct?.getFirstAncestorByKind(
    tsmorph.SyntaxKind.PropertyAssignment,
  );
  if (
    tsmorph.Node.isReferenceFindable<tsmorph.Node>(potentialAssignment) &&
    tsmorph.Node.hasName(potentialAssignment)
  ) {
    return potentialAssignment;
  }
};

const findParentFunction = (
  ref: tsmorph.Node,
): NamedNodeWithReferences | undefined =>
  ref.getFirstAncestor(isNamedFunction) ??
  findAssignedFunction(ref) ??
  findPropertyAssignedFunction(ref);

const tsConfigFilePath = './tsconfig.json';
const targetFile = process.argv[2];
const targetIdentifier = process.argv[3];
const showTop = process.argv[4] === 'top'; // if false, the entire tree is printed
const dedup = false; // if true, each reference is printed only once

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
    if (dedup === false) return nodes; // don't exclude anything
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
    // TODO: exclude assignments to "node" ?
  }
  return [];
};

const allRefs: Reference[] = [
  ...refs.map((ref) => ({ node: ref, refs: buildRefsSubTree(ref) })),
];

const render = (ref: Reference) => {
  const filePath = ref.node
    .getSourceFile()
    .getFilePath()
    .replace(__dirname, '');
  const lineNumber = ref.node.getStartLineNumber();
  const callee = ref.node.getText();
  const parentFct = findParentFunction(ref.node);
  const referrer = parentFct
    ? (parentFct.getName() ?? '[anonymous function]')
    : '[top level]';
  return `${filePath}:${lineNumber}, ${callee} referenced by ${referrer}`;
};

const printReferences = (ref: Reference, depth = 0) => {
  console.log(`${' '.repeat(depth)}${render(ref)}`);
  ref.refs.forEach((subRef) => printReferences(subRef, depth + 1));
};

const countReferences = (ref: Reference) => {
  return ref.refs.reduce((count, subRef) => count + countReferences(subRef), 1);
};

if (showTop) {
  allRefs
    .map((ref) => ({
      ref,
      count: countReferences(ref),
    }))
    .sort((a, b) => b.count - a.count)
    .forEach(({ ref, count }) => console.log(`(${count})\t${render(ref)}`));
} else {
  allRefs.forEach((ref) => printReferences(ref));
}
