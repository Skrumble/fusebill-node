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
  }),
  activateDraftInvoice: fusebillMethod({
    method: 'POST',
    path: function(urlData) {
      var url = '?draftInvoiceId=' + urlData.draftInvoiceId;
      return url;
    },
    urlParams: ['draftInvoiceId'],
  }),

});
