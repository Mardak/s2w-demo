/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Factory, Unknown} = require("sdk/platform/xpcom");
const {PageMod} = require("sdk/page-mod");
const {Class} = require("sdk/core/heritage");
const {data} = require("sdk/self");
const ui = require("sdk/ui");
const tabs = require("sdk/tabs");
const {PledgeButton} = require("PledgeButton");
const {PledgedSites} = require("PledgedSites");
const {HistoryReader} = require("HistoryReader");
const historyUtils = require("HistoryUtils");

const {Cc, Ci, Cu, ChromeWorker} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");

function formatPledgedData() {
  let pledges = PledgedSites.getPledgeData();
  return HistoryReader.getHostsData(pledges.sites).then((totals) => {
    let totalWeight = 0;
    Object.keys(pledges.sites).forEach(site => {
      totalWeight += pledges.sites[site].visits * pledges.sites[site].pledged;
    });
    // compute percentage
    Object.keys(pledges.sites).forEach(site => {
      pledges.sites[site].percentage = Math.round(pledges.sites[site].visits * pledges.sites[site].pledged / totalWeight * 100);
    });
    //dump(JSON.stringify(pledges.sites) + " <<<<\n");
    dump(JSON.stringify(pledges) + " <<<<\n");
    return pledges;
  });
}

function remakeUI(worker) {
  return formatPledgedData().then(pledgedData => {
    worker.port.emit("pledgedSites", pledgedData);
  });
}

exports.main = function(options, callbacks) {
  // about page declaration
  Factory({
    contract: "@mozilla.org/network/protocol/about;1?what=s2w-demo",

    Component: Class({
      extends: Unknown,
      interfaces: ["nsIAboutModule"],

      newChannel: function(uri) {
        let chan = Services.io.newChannel(data.url("index.html"), null, null);
        chan.originalURI = uri;
        return chan;
      },

      getURIFlags: function(uri) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
      }
    })
  });

  Factory({
    contract: "@mozilla.org/network/protocol/about;1?what=s2w-debug",

    Component: Class({
      extends: Unknown,
      interfaces: ["nsIAboutModule"],

      newChannel: function(uri) {
        let chan = Services.io.newChannel(data.url("debug.html"), null, null);
        chan.originalURI = uri;
        return chan;
      },

      getURIFlags: function(uri) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
      }
    })
  });

  PageMod({
    // load scripts
    contentScriptFile: [
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
    ],

    include: ["about:s2w-demo"],

    onAttach: function(worker) {
      // inject styles
      worker.port.emit("style", data.url("css/bootstrap.min.css"));
      worker.port.emit("style", data.url("css/bootstrap-theme.min.css"));
      worker.port.emit("style", data.url("css/styles.css"));

      worker.port.on("unpledge", function(site) {
        PledgedSites.unpledgeSiteForNextMonth(site);
        remakeUI(worker);
      });
      worker.port.on("next-month-pledge-amount", function(dollars) {
        PledgedSites.setNextMonthPledgedAmount(dollars || 0);
        remakeUI(worker);
      });

      remakeUI(worker);
    },
  });

  PageMod({
    // load scripts
    contentScriptFile: [
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
    ],

    include: ["about:s2w-debug"],

    onAttach: function(worker) {
      // inject styles
      worker.port.emit("style", data.url("css/bootstrap.min.css"));
      worker.port.emit("style", data.url("css/bootstrap-theme.min.css"));
      worker.port.emit("style", data.url("css/styles.css"));

      remakeUI(worker);
      worker.port.on("pledged", function(site) {
        PledgedSites.addPledgeToSite(site);
        remakeUI(worker);
      });
      worker.port.on("cleared", function(site) {
        PledgedSites.clearSite(site);
        remakeUI(worker);
      });
      worker.port.on("monthly-amount", function(dollars) {
        PledgedSites.setPledgedAmount(dollars || 0);
        remakeUI(worker);
      });
    },
  });

  let courtClerk = {
    onPledge: function(siteInfo) {
      // add to site pledge count
      PledgedSites.addPledge(siteInfo);
      // and update
      siteInfo.pledged ++;
      PledgeButton.setCurrentSite(siteInfo);
    },
    onClear: function(siteInfo) {
      PledgedSites.clearSite(siteInfo.host);
      siteInfo.pledged = 0;
      PledgeButton.setCurrentSite(siteInfo);
    }
  };

  PledgeButton.init(courtClerk);
  PledgedSites.init();

  function handlePageShow(url) {
    if (url == null || url.startsWith("about:")) {
      PledgeButton.setCurrentSite(null);
      return;
    }

    try {
      let uri = NetUtil.newURI(url);
      let host = uri.host.replace(/^www\./, "");
      let siteInfo = Cu.cloneInto(PledgedSites.getPledgedSite(host), {});
      siteInfo.host = host;
      PledgeButton.setCurrentSite(siteInfo);
    }
    catch (e) {
      dump(e + " ERROR\b");
    }
  };

  tabs.on('load', function (tab) {
    handlePageShow(tab.url);
  });

  tabs.on('activate', function (tab) {
    handlePageShow(tab.url);
  });

  let apiInjector = function(doc, topic, data) {
    if (doc.contentWindow) return; // ignore iframes
    let {defaultView, location} = doc;
    let host = (location ? location.host : null);
    if (host && !host.contains("jetpack")) {
      host = host.replace(/^www\./, "");
      defaultView.wrappedJSObject.getPledgedSupport = function () {
        PledgedSites.setCanPledge(host);
        return true;
      };
    }
  };
  Services.obs.addObserver(apiInjector, "document-element-inserted", false);
}
