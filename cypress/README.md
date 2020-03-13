# Stuff to know about Cypress

## Assertions

As mentioned in [Introduction to Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html#Assertions):

> What makes Cypress unique from other testing tools is that commands **automatically retry** their assertions. In fact, they will look “downstream” at what you’re expressing and modify their behavior to make your assertions pass.

Most examples from their documentation rely on their own `should()` assertion method, which can be called on DOM references returned by `cy.get()`.

E.g. `cy.get('button').click().should('have.class', 'active')`

As explained [there](https://docs.cypress.io/guides/references/assertions.html), Cypress supports the following ways to express assertions:

- [Chai BDD](https://www.chaijs.com/api/bdd/); (e.g. `expect(name).to.not.equal('Jane')`)
- [Chai TDD](https://www.chaijs.com/api/assert/); (e.g. `assert.notEqual(3, 4, 'vals not equal')`)
- [chai-jquery](https://github.com/chaijs/chai-jquery); (e.g. `expect($el).to.have.attr('foo', 'bar')`)
- and [sinon-chai](https://github.com/domenic/sinon-chai). (e.g. `expect(spy).to.be.calledTwice`)

Some methods return jQuery objects. In that case, please refer to the [jQuery API reference documentation](https://api.jquery.com/).

## To be continued...
