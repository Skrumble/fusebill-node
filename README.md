# Fusebill node.js bindings 

## Installation

`npm install fingerfoodstudios/fusebill-node`

## Documentation

Documentation is NOT available the API documentation is here http://help.fusebill.com/api-resource-urls

## API Overview

Every resource is accessed via your `fusebill` instance:

```js
var fusebill = require('fusebill')(' your fusebill API key ');
// fusebill.{ RESOURCE_NAME }.{ METHOD_NAME }
```

Every resource method accepts an optional callback as the last argument:

```js
fusebill.customers.create(
  { primaryEmail: 'customer@example.com' },
  function(err, customer) {
    err; // null if no error occurred
    customer; // the created customer object
  }
);
```

Additionally, every resource method returns a promise, so you don't have to use the regular callback. E.g.

```js
// Create a new customer and then a new charge for that customer:
fusebill.customers.create({
  primaryEmail: 'foo-customer@example.com'
}).then(function(customer) {
  return fusebill.subscription.create({
    customerId: customer.id,
    planFrequencyId: 9999
  });
}).then(function(charge) {
  // New charge created on a new customer
}).catch(function(err) {
  // Deal with an error
});
```

To use the `Fusebill-Account` header, simply pass an extra options hash:

```js
// Retrieve the balance for a connected account:
fusebill.balance.retrieve({
  fusebill_account: "acct_foo"
}).then(function(balance) {
  // The balance object for the connected account
}).catch(function(err) {
  // Error
});
```

### Available resources & methods

*STILL A WORK IN PROGRESS*

*Where you see `params` it is a plain JavaScript object, e.g. `{ email: 'foo@example.com' }`*

 * customers
  * [`create(params)`](http://help.fusebill.com/api-create-customer)
  * [`list([params])`](http://help.fusebill.com/api-list-customers)
  * [`update(customerId[, params])`](http://help.fusebill.com/api-list-customers)
  * [`retrieve(customerId)`](http://help.fusebill.com/api-read-customer)
  * [`listSubscriptions(customerId)`](http://help.fusebill.com/api-list-subscriptions)
  * [`listEmailPreferences(customerId)`](http://help.fusebill.com/api-read-customer-email-preferences)
  * [`listInvoices(customerId)`](http://help.fusebill.com/api-list-posted-invoices)
  * [`listDraftInvoices(customerId)`](http://help.fusebill.com/api-list-draft-invoices)
 * customerActivation
  * [`activate(customerId)`](http://help.fusebill.com/api-customer-activation)
 * customerAddressPreferences
  * [`retrieve(customerId)`](http://help.fusebill.com/api-read-customer-address-preferences)
 * customerBillingSettings
 * customerEmailPreferences
 * draftInvoices
 * invoices
  * [`retrieve(invoiceId)`](http://help.fusebill.com/api-read-posted-invoice)
  * [`retrievePdf(invoiceId)`](http://help.fusebill.com/api-get-posted-invoice-as-pdf)
 * paymentMethods
 * plans
  * [`list([params])`](http://help.fusebill.com/api-get-plans)
  * [`retrieve(planId)`](http://help.fusebill.com/api-read-plan)
  * [`listProducts(planId)`](http://help.fusebill.com/api-list-planproduct-by-plan-id)
  * [`retrieveProducts(planId)`](https://fusebill.com/docs/api/node#retrieve_plan)
 * planProducts
 * products
  * [`list([params])`](http://help.fusebill.com/api-list-products)
  * [`retrieve(productId)`](http://help.fusebill.com/api-read-product)
 * purchases
 * subscriptions
  * [`create(params)`](https://fusebill.com/docs/api/node#create_subscription_beta)
  * [`list([params])`](https://fusebill.com/docs/api/node#list_subscription_beta)
  * [`update(subscriptionID[, params])`](https://fusebill.com/docs/api/node#update_subscription_beta)
  * [`retrieve(subscriptionId)`](https://fusebill.com/docs/api/node#retrieve_subscription_beta)
  * [`del(subscriptionId)`](https://fusebill.com/docs/api/node#delete_subscription_beta)
 * subscriptionActivation
  * [`activate(subscriptionId)`](http://help.fusebill.com/api-subscription-activation)

## Configuration

 * `fusebill.setApiKey(' your secret api key ');`
 * `fusebill.setTimeout(20000); // in ms` (default is node's default: `120000ms`)

## More information

http://help.fusebill.com/


## Development

* NOTE Tests are NOT working *
Run the tests using [`npm`](https://www.npmjs.com/):

```bash
$ npm install
$ npm test
```

If you wish, you may run tests using your Fusebill *Test* API key by setting the environment variable `STRIPE_TEST_API_KEY` before running tests:

```bash
$ export FUSEBILL_TEST_API_KEY='sk_test....'
$ npm test
```

*Note: On Windows use `SET` instead of `export` for setting the `FUSEBILL_TEST_API_KEY` environment variable.*


## Author

Originally by [Ask Bjørn Hansen](https://github.com/abh) (ask@develooper.com). Development was sponsored by YellowBot. 
Adapted for Fusebill by [Justin Hamade](https://github.com/justhamade)
