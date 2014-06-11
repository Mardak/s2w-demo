/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Cc,Ci,Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm", this);
const {data} = require("sdk/self");
const {storage} = require("sdk/simple-storage");

let PledgedSites = {

  init: function () {
    if (storage.pledgedSites == null) {
      storage.pledgedSites = {};
    }
  },

  addPledge: function(siteInfo) {
    if (storage.pledgedSites[siteInfo.host] == null) {
      storage.pledgedSites[siteInfo.host] = {
        pledged: 0,
      };
    }
    storage.pledgedSites[siteInfo.host].pledged ++;
    storage.pledgedSites[siteInfo.host].canPledge = siteInfo.canPledge;
  },

  addPledgeToSite: function(site) {
    storage.pledgedSites[site].pledged ++;
  },

  getPledged: function(site) {
    if (storage.pledgedSites[site] == null) return 0;
    return storage.pledgedSites[site].pledged;
  },

  getPledgedSites: function () {
    return storage.pledgedSites;
  },

  clearSite: function(site) {
    if (storage.pledgedSites[site]) {
      storage.pledgedSites[site].pledged = 0;
    }
  },

};

exports.PledgedSites = PledgedSites;
