'use strict';

var FusebillResource = require('../FusebillResource');
var fusebillMethod = FusebillResource.method;

module.exports = FusebillResource.extend({

  path: 'customeractivation',
  includeBasic: [],
  activate: fusebillMethod({
    method: 'POST',
    path: function(urlData) {
      var url = '';
      if (urlData.preview && typeof urlData.preview === 'boolean') {
        url = url + '?preview=' + urlData.preview;
      }
      return url;
    },
    urlParams: ['optional!preview', 'optional!showZeroDollarCharges', 'optional!temporarilyDisableAutoPost'],
  }),
});
