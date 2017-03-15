'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;
var utils = require('../utils');

module.exports = FusebillResource.extend({

  path: 'draftinvoices',
  includeBasic: ['retrieve',],

  retrievePdf: fusebillMethod({
    method: 'GET',
      path: '/pdf/{invoiceId}',
      urlParams: ['invoiceId']
  }),
});
