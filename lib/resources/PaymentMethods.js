'use strict';

var FusebillResource = require('../FusebillResource');
var utils = require('../utils');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'paymentmethods',
  includeBasic: ['retrieve', 'update', 'create', 'del'],

  setPaymentMethodDefault: fusebillMethod({
    method: 'POST',
    path: function(urlData) {
      var url = '/makeDefault?id=' + urlData.paymentId + '&type=' + urlData.paymentType;
      return url;
    },
    urlParams: ['paymentId', 'paymentType'],
  }),
});
