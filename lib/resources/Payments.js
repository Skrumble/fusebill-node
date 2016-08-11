'use strict';

var FusebillResource = require('../FusebillResource');

module.exports = FusebillResource.extend({

  path: 'payments',
  includeBasic: ['list','retrieve', 'update', 'create'],
});
