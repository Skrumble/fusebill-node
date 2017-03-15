'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'subscriptioncancellation',
  includeBasic: [],
  cancel: fusebillMethod({
    method: 'POST',
    path: '/subscriptionCancellation',
  }),
});
