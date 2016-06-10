'use strict';

var testUtils = require('./testUtils');
var chai = require('chai');
var Promise = require('bluebird');
var fusebill = require('../lib/fusebill')(
  testUtils.getUserFusebillKey(),
  'latest'
);

var expect = chai.expect;

var exp_year = new Date().getFullYear() + 1;

var CUSTOMER_DETAILS = {
  description: 'Some customer',
  card: {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: exp_year,
  },
};

var CURRENCY = '_DEFAULT_CURRENCY_NOT_YET_GOTTEN_';

describe.skip('Flows', function() {
  // Note: These tests must be run as one so we can retrieve the
  // default_currency (required in subsequent tests);

  var cleanup = new testUtils.CleanupUtility();
  this.timeout(30000);

  it('Allows me to retrieve default_currency', function() {
    return expect(
      fusebill.account.retrieve()
        .then(function(acct) {
          CURRENCY = acct.default_currency;
          return acct;
        })
    ).to.eventually.have.deep.property('default_currency');
  });

  describe('Plan+Subscription flow', function() {
    it('Allows me to: Create a plan and subscribe a customer to it', function() {
      return expect(
        Promise.join(
          fusebill.plans.create({
            id: 'plan' + (new Date()).getTime(),
            amount: 1700,
            currency: CURRENCY,
            interval: 'month',
            name: 'Gold Super Amazing Tier',
          }),
          fusebill.customers.create(CUSTOMER_DETAILS)
        ).then(function(j) {
          var plan = j[0];
          var customer = j[1];

          cleanup.deleteCustomer(customer.id);
          cleanup.deletePlan(plan.id);

          return fusebill.customers.updateSubscription(customer.id, {
            plan: plan.id,
          });
        })
      ).to.eventually.have.property('status', 'active');
    });

    it(
      'Allows me to: Create a plan and subscribe a customer to it, and update subscription (multi-subs API)',
      function() {
        var plan;
        return expect(
          Promise.join(
            fusebill.plans.create({
              id: 'plan' + (new Date()).getTime(),
              amount: 1700,
              currency: CURRENCY,
              interval: 'month',
              name: 'Gold Super Amazing Tier',
            }),
            fusebill.customers.create(CUSTOMER_DETAILS)
          ).then(function(j) {
            plan = j[0];
            var customer = j[1];

            cleanup.deleteCustomer(customer.id);
            cleanup.deletePlan(plan.id);

            return fusebill.customers.createSubscription(customer.id, {
              plan: plan.id,
            });
          }).then(function(subscription) {
            return fusebill.customers.updateSubscription(subscription.customer, subscription.id, {
              plan: plan.id, quantity: '3',
            });
          }).then(function(subscription) {
            return [subscription.status, subscription.quantity];
          })
        ).to.eventually.deep.equal(['active', 3]);
      }
    );

    it('Errors when I attempt to subscribe a customer to a non-existent plan', function() {
      return expect(
        fusebill.customers.create(CUSTOMER_DETAILS)
          .then(function(customer) {
            cleanup.deleteCustomer(customer.id);

            return fusebill.customers.updateSubscription(customer.id, {
              plan: 'someNonExistentPlan' + (new Date()).getTime(),
            }).then(null, function(err) {
              // Resolve with the error so we can inspect it below
              return err;
            });
          })
      ).to.eventually.satisfy(function(err) {
        return err.type === 'FusebillInvalidRequestError' &&
          err.rawType === 'invalid_request_error';
      });
    });

    it('Allows me to: subscribe then cancel with `at_period_end` defined', function() {
      return expect(
        Promise.join(
          fusebill.plans.create({
            id: 'plan' + (new Date()).getTime(),
            amount: 1700,
            currency: CURRENCY,
            interval: 'month',
            name: 'Silver Super Amazing Tier',
          }),
          fusebill.customers.create(CUSTOMER_DETAILS)
        ).then(function(j) {
          var plan = j[0];
          var customer = j[1];

          cleanup.deleteCustomer(customer.id);
          cleanup.deletePlan(plan.id);

          return fusebill.customers.updateSubscription(customer.id, {
            plan: plan.id,
          });
        }).then(function(subscription) {
          return fusebill.customers.cancelSubscription(subscription.customer, {
            at_period_end: true,
          });
        })
      ).to.eventually.have.property('cancel_at_period_end', true);
    });

    describe('Plan name variations', function() {
      [
        '34535 355453' + (new Date()).getTime(),
        'TEST 239291' + (new Date()).getTime(),
        'TEST_a-i' + (new Date()).getTime(),
        'foobarbazteston###etwothree' + (new Date()).getTime(),
      ].forEach(function(planID) {
        it('Allows me to create and retrieve plan with ID: ' + planID, function() {
          var plan;
          return expect(
            fusebill.plans.create({
              id: planID,
              amount: 1700,
              currency: CURRENCY,
              interval: 'month',
              name: 'generic',
            }).then(function() {
              cleanup.deletePlan(planID);
              return fusebill.plans.retrieve(planID);
            })
          ).to.eventually.have.property('id', planID);
        });
      });
    });
  });

  describe('Coupon flow', function() {
    var customer;
    var coupon;

    describe('When I create a coupon & customer', function() {
      it('Does so', function() {
        return expect(
          Promise.join(
            fusebill.coupons.create({
              percent_off: 20,
              duration: 'once',
            }),
            fusebill.customers.create(CUSTOMER_DETAILS)
          ).then(function(joined) {
            coupon = joined[0];
            customer = joined[1];
          })
        ).to.not.be.eventually.rejected;
      });
      describe('And I apply the coupon to the customer', function() {
        it('Does so', function() {
          return expect(
            fusebill.customers.update(customer.id, {
              coupon: coupon.id,
            })
          ).to.not.be.eventually.rejected;
        });
        it('Can be retrieved from that customer', function() {
          return expect(
            fusebill.customers.retrieve(customer.id)
          ).to.eventually.have.deep.property('discount.coupon.id', coupon.id);
        });
        describe('The resulting discount', function() {
          it('Can be removed', function() {
            return expect(
              fusebill.customers.deleteDiscount(customer.id)
            ).to.eventually.have.property('deleted', true);
          });
          describe('Re-querying it', function() {
            it('Does indeed indicate that it is deleted', function() {
              return expect(
                fusebill.customers.retrieve(customer.id)
              ).to.eventually.have.deep.property('discount', null);
            });
          });
        });
      });
    });
  });

  describe('Metadata flow', function() {
    it('Can save and retrieve metadata', function() {
      var customer;
      return expect(
        fusebill.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
            return fusebill.customers.setMetadata(cust.id, {foo: '123'});
          })
          .then(function() {
            return fusebill.customers.getMetadata(customer.id);
          })
      ).to.eventually.deep.equal({foo: '123'});
    });
    it('Can reset metadata', function() {
      var customer;
      return expect(
        fusebill.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
            return fusebill.customers.setMetadata(cust.id, {baz: '123'});
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, null);
          })
          .then(function() {
            return fusebill.customers.getMetadata(customer.id);
          })
      ).to.eventually.deep.equal({});
    });
    it('Resets metadata when setting new metadata', function() {
      var customer;
      return expect(
        fusebill.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
            return fusebill.customers.setMetadata(cust.id, {foo: '123'});
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, {baz: '456'});
          })
      ).to.eventually.deep.equal({baz: '456'});
    });
    it('Can set individual key/value pairs', function() {
      var customer;
      return expect(
        fusebill.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, 'baz', 456);
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, '_other_', 999);
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, 'foo', 123);
          })
          .then(function() {
            // Change foo
            return fusebill.customers.setMetadata(customer.id, 'foo', 222);
          })
          .then(function() {
            // Delete baz
            return fusebill.customers.setMetadata(customer.id, 'baz', null);
          })
          .then(function() {
            return fusebill.customers.getMetadata(customer.id);
          })
      ).to.eventually.deep.equal({_other_: '999', foo: '222'});
    });
    it('Can set individual key/value pairs [with per request token]', function() {
      var customer;
      var authToken = testUtils.getUserFusebillKey();
      return expect(
        fusebill.customers.create(CUSTOMER_DETAILS)
          .then(function(cust) {
            customer = cust;
            cleanup.deleteCustomer(cust.id);
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, {'baz': 456}, authToken);
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, '_other_', 999, authToken);
          })
          .then(function() {
            return fusebill.customers.setMetadata(customer.id, 'foo', 123, authToken);
          })
          .then(function() {
            // Change foo
            return fusebill.customers.setMetadata(customer.id, 'foo', 222, authToken);
          })
          .then(function() {
            // Delete baz
            return fusebill.customers.setMetadata(customer.id, 'baz', null, authToken);
          })
          .then(function() {
            return fusebill.customers.getMetadata(customer.id, authToken);
          })
      ).to.eventually.deep.equal({_other_: '999', foo: '222'});
    });
  });

  describe('Expanding', function() {
    describe('A customer within a charge', function() {
      it('Allows you to expand a customer object', function() {
        return expect(
          fusebill.customers.create(CUSTOMER_DETAILS)
            .then(function(cust) {
              cleanup.deleteCustomer(cust.id);
              return fusebill.charges.create({
                customer: cust.id,
                amount: 1700,
                currency: CURRENCY,
                expand: ['customer'],
              });
            })
        ).to.eventually.have.deep.property('customer.created');
      });
    });
    describe('A customer\'s default source', function() {
      it('Allows you to expand a default_source', function() {
        return expect(
          fusebill.customers.create({
            description: 'Some customer',
            source: {
              object: 'card',
              number: '4242424242424242',
              exp_month: 12,
              exp_year: exp_year,
            },
            expand: ['default_source'],
          })
            .then(function(cust) {
              cleanup.deleteCustomer(cust.id);
              return cust;
            })
        // Confirm it's expanded by checking that some prop (e.g. exp_year) exists:
        ).to.eventually.have.deep.property('default_source.exp_year');
      });
    });
  });

  describe('Charge', function() {
    it('Allows you to create a charge', function() {
      return expect(
        fusebill.charges.create({
          amount: 1234,
          currency: CURRENCY,
          card: {
            number: '4000000000000002',
            exp_month: 12,
            exp_year: exp_year,
            cvc: 123,
          },
          shipping: {
            name: 'Bobby Tables',
            address: {
              line1: '1 Foo St.',
            },
          },
        }).then(null, function(error) {
          return error;
        })
      ).to.eventually.have.deep.property('raw.charge');
    });
  });

  describe('Getting balance', function() {
    it('Allows me to do so', function() {
      return expect(
        fusebill.balance.retrieve()
      ).to.eventually.have.property('object', 'balance');
    });
    it('Allows me to do so with specified auth key', function() {
      return expect(
        fusebill.balance.retrieve(testUtils.getUserFusebillKey())
      ).to.eventually.have.property('object', 'balance');
    });
  });
});
