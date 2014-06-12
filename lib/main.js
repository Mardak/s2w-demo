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

const {Cc, Ci, Cu, ChromeWorker} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");

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

      worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      worker.port.on("pledged", function(site) {
        PledgedSites.addPledgeToSite(site);
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      });
      worker.port.on("cleared", function(site) {
        PledgedSites.clearSite(site);
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      });
      worker.port.on("monthly-amount", function(dollars) {
        PledgedSites.setPledgedAmount(dollars || 0);
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
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
      let siteInfo = {
        host: host,
        pledged: PledgedSites.getPledged(host),
      };
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
    let {defaultView, location} = doc;
    let host = (location ? location.host : null);
    if (host && !host.contains("jetpack")) {
      host = host.replace(/^www\./, "");
      defaultView.wrappedJSObject.getPledgedSupport = function () {
        PledgedSites.setCanPledge(host);
        return PledgedSites.getPledgedAmountForHost(host);
      };
    }
  };
  Services.obs.addObserver(apiInjector, "document-element-inserted", false);
}
