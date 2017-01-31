'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;
var utils = require('../utils');

module.exports = FusebillResource.extend({

  path: 'invoices',
  includeBasic: ['retrieve'],

  retrievePdf: fusebillMethod({
    method: 'GET',
      path: '/pdf/{invoiceId}',
      urlParams: ['invoiceId']
  })

  /**
   * Invoices: Invoice PDF
   */

  getPDF: fusebillMethod({
    method: 'GET',
    path: "/pdf/{invoiceID}"
    urlParams: ['invoiceID'],
  }),

});
