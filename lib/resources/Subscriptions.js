'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'subscriptions',
  includeBasic: ['create', 'retrieve', 'del',],

  /**
   * Subscription: Discount methods
   */

  deleteDiscount: fusebillMethod({
    method: 'DELETE',
    path: '/{subscriptionId}/discount',
    urlParams: ['subscriptionId'],
  }),

  update: fusebillMethod({
    method: 'PUT',
    path: function (urlData) {
      var url = '';
      if (urlData.preview && typeof urlData.preview === 'boolean') {
        url = url + '?preview=' + urlData.preview;
      }
      return url;
    },
    urlParams: ['optional!preview', 'optional!showZeroDollarCharges', 'optional!temporarilyDisableAutoPost'],
  }),

});
