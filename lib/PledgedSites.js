/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Cc,Ci,Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm", this);
const {data} = require("sdk/self");
const {storage} = require("sdk/simple-storage");

let PledgedSites = {

  _initSite: function(site, force) {
    if (storage.pledges.sites[site] == null || force) {
      storage.pledges.sites[site] = {
        pledged: 0,
        canPledge: false,
      };
    }
  },

  init: function () {
    if (storage.pledges == null) {
      storage.pledges = {
        sites: {},
        amount: 0,
        total: 0,
        nextMonthAmount: 0,
      };
    }
  },


  addPledge: function(siteInfo) {
    this._initSite(siteInfo.host);
    storage.pledges.sites[siteInfo.host].pledged ++;
    storage.pledges.total ++;
  },

  addPledgeToSite: function(site) {
    storage.pledges.sites[site].pledged ++;
    storage.pledges.total ++;
  },

  setCanPledge: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].canPledge = true;
  },

  getPledged: function(site) {
    if (storage.pledges.sites[site] == null) return 0;
    return storage.pledges.sites[site].pledged;
  },

  getPledgedSites: function () {
    return storage.pledges.sites;
  },

  getPledgedSite: function (site) {
    if (storage.pledges.sites[site] == null) {
      return {pledged: 0};
    }
    else {
      return storage.pledges.sites[site];
    }
  },

  unpledgeSiteForNextMonth: function(site) {
    if (storage.pledges.sites[site]) {
      storage.pledges.sites[site].unpledged = true;
    }
  },

  clearSite: function(site) {
    if (storage.pledges.sites[site]) {
      storage.pledges.total -= storage.pledges.sites[site].pledged;
      this._initSite(site, true);
    }
  },

  setPledgedAmount: function(val) {
    storage.pledges.amount = val;
  },

  getPledgedAmount: function () {
    return storage.pledges.amount;
  },

  setNextMonthPledgedAmount: function(val) {
    storage.pledges.nextMonthAmount = val;
  },

  getNextMonthPledgedAmount: function () {
    return storage.pledges.nextMonthAmount;
  },

  getPledgedAmountForHost: function (site) {
    if (storage.pledges.sites[site]) {
      return Math.round(storage.pledges.amount /
                        storage.pledges.total *
                        storage.pledges.sites[site].pledged *
                        100.00) / 100;
    }
    return 0;
  },

  getPledgeData: function () {
    return storage.pledges;
  },
};

exports.PledgedSites = PledgedSites;
