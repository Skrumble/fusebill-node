'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'country_specs',

  includeBasic: [
    'list', 'retrieve',
  ],
});
