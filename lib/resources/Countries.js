'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'countries',
  includeBasic: [],
  list: fusebillMethod({
    method: 'GET',
  }),
});
