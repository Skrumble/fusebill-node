'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'coupons',
  includeBasic: ['create', 'list', 'update', 'retrieve', 'del'],

  validate: fusebillMethod({
    method: 'POST',
    path: '/Validate'
  }),
  
});

