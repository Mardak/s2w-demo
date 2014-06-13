/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Cc,Ci,Cu} = require("chrome");
const {PlacesAccessUtils} = require("PlacesAccessUtils");


let HistoryReader = {

  // @TODO - this can be optimized by moving host reversal to PledgedSites
  getHostsData: function(hosts) {
    Object.keys(hosts).forEach(host => {
      hosts[host].visits = 0;
      hosts[host].frecency = 0;
    });
    let totals = {
      visits: 0,
      frecency: 0,
    };
    return PlacesAccessUtils.getPlacesHosts(item => {
      if(item.rev_host && item.visit_count > 0) {
        let host = item.rev_host.split("").reverse().join("");
        host = host.substr(1).replace(/^www\./, "");
        if (hosts[host]) {
          hosts[host].visits += item.visit_count;
          hosts[host].frecency += item.frecency;
          totals.visits += item.visit_count;
          totals.frecency += item.frecency;
        }
      }
    }).then(() => {
      return totals;
    });
  },
};

exports.HistoryReader = HistoryReader;
