'use strict';

var fusebill = require('../testUtils').getSpyableFusebill();
var expect = require('chai').expect;

describe('Invoices Resource', function() {
  describe('retrieve', function() {
    it('Sends the correct request', function() {
      fusebill.invoices.retrieve('invoiceId1');
      expect(fusebill.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/invoices/invoiceId1',
        headers: {},
        data: {},
      });
    });
  });

  describe('retrievePdf', function() {
    it('Sends the correct request', function() {
      fusebill.invoices.retrieve('invoiceId1');
      expect(fuesbill.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/invoices/pdf/invoiceId1',
        headers: {},
        data: {},
      });
    });
  });

  describe('create', function() {
    it('Sends the correct request', function() {
      fusebill.invoices.create({application_fee: 111});
      expect(fusebill.LAST_REQUEST).to.deep.equal({
        method: 'POST',
        url: '/v1/invoices',
        headers: {},
        data: {application_fee: 111},
      });
    });
  });

  describe('update', function() {
    it('Sends the correct request', function() {
      fusebill.invoices.update('invoiceId1', {application_fee: 200});
      expect(fusebill.LAST_REQUEST).to.deep.equal({
        method: 'POST',
        url: '/v1/invoices/invoiceId1',
        headers: {},
        data: {application_fee: 200},
      });
    });
  });

  describe('retrieveLines', function() {
    it('Sends the correct request', function() {
      fusebill.invoices.retrieveLines('invoiceId2');
      expect(fusebill.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/invoices/invoiceId2/lines',
        headers: {},
        data: {},
      });
    });
  });

  describe('retrieveUpcoming', function() {
    describe('With just a customer ID', function() {
      it('Sends the correct request', function() {
        fusebill.invoices.retrieveUpcoming('customerId1');
        expect(fusebill.LAST_REQUEST).to.deep.equal({
          method: 'GET',
          url: '/v1/invoices/upcoming?customer=customerId1',
          headers: {},
          data: {},
        });
      });
    });

    describe('With a subscription ID in addition to a customer ID', function() {
      it('Sends the correct request', function() {
        fusebill.invoices.retrieveUpcoming('customerId1', 'subscriptionId123');
        expect(fusebill.LAST_REQUEST).to.deep.equal({
          method: 'GET',
          url: '/v1/invoices/upcoming?customer=customerId1&subscription=subscriptionId123',
          headers: {},
          data: {},
        });
      });
    });

    describe('With a options object in addition to a customer ID', function() {
      it('Sends the correct request', function() {
        fusebill.invoices.retrieveUpcoming('customerId1', {plan: 'planId123'});
        expect(fusebill.LAST_REQUEST).to.deep.equal({
          method: 'GET',
          url: '/v1/invoices/upcoming?customer=customerId1&plan=planId123',
          headers: {},
          data: {},
        });
      });
    });
  });

  describe('pay', function() {
    it('Sends the correct request', function() {
      fusebill.invoices.pay('invoiceId6');
      expect(fusebill.LAST_REQUEST).to.deep.equal({
        method: 'POST',
        url: '/v1/invoices/invoiceId6/pay',
        headers: {},
        data: {},
      });
    });
  });

  describe('list', function() {
    it('Sends the correct request', function() {
      fusebill.invoices.list({count: 25});
      expect(fusebill.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/invoices',
        headers: {},
        data: {count: 25},
      });
    });
  });
});
