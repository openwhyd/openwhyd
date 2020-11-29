// This suite intends to navigate through all pages, to detect visual regressions.

context('Visual Snapshots', () => {
  before(() => {
    cy.eyesOpen({
      appName: 'Openwhyd',
      testName: 'Visual Snapshots',
      browser: { width: 1000, height: 660 }, // cf https://docs.cypress.io/api/commands/viewport.html#Defaults
    });
  });

  after(() => {
    cy.eyesClose();
  });

  it('visitor', () => {
    // should have Openwhyd in its title
    cy.visit('/');
    cy.eyesCheckWindow('visitor on /');
  });
});
