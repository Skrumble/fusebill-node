'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'subscriptioncoupons',
  includeBasic: [],

  apply: fusebillMethod({
    method: 'POST',
  }),
  
});

