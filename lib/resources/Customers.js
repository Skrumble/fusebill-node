'use strict';

var FusebillResource = require('../FusebillResource');
var utils = require('../utils');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'customers',
  includeBasic: [
    'create', 'list', 'retrieve', 'update', 'del',
  ],

  /**
   * Customer: Subscription methods
   */

  listSubscriptions: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/subscriptions',
    urlParams: ['customerId'],
  }),

  retrieveSubscription: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/subscriptions/{subscriptionId}',
    urlParams: ['customerId', 'subscriptionId'],
  }),

  /**
   * Customer: Email Preference methods
   */

  listEmailPreferences: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/CustomerEmailPreferences',
    urlParams: ['customerId'],
  }),

  /**
   * Customer: Invoice methods
   */

  listInvoices: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/invoices',
    urlParams: ['customerId'],
  }),

  listDraftInvoices: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/DraftInvoices',
    urlParams: ['customerId'],
  }),

  listPaymentMethods: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/paymentmethods',
    urlParams: ['customerId'],
  }),

  /**
   * Customer: Credit Cards
   */

  listCreditCards: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/CreditCards',
    urlParams: ['customerId'],
  }),

  /**
   * Customer: Transactions
   */

  listTransactions: fusebillMethod({
    method: 'GET',
    path: function(urlData) {
      var url = '/' + urlData.customerId + "/customerArActivities";
      if (urlData.startDate && urlData.endDate) {
        url = url + '?query=' + urlData.startDate + ";" + urlData.endDate
      }
      return url;
    },
    urlParams: ['customerId', 'optional!startDate', 'optional!endDate'],
  }),
  
  listPurchases: fusebillMethod({
    method: 'GET',
    path: '/{customerId}/purchases',
    urlParams: ['customerId'],
  }),

});
