/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Cc,Ci,Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm", this);
const {data} = require("sdk/self");
const ui = require("sdk/ui");
const {Panel} = require("sdk/panel");

let PledgeButton = {

  init: function (courtClerk) {
   let self = this;
   this.pledgePanel = Panel({
     contentURL: data.url("pledgePanel.html"),
     contentScriptFile: [
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
     ],
     onHide: function () {
       self.pledgeButton.state("window", {checked: false, disabled: false});
     },
   });
   this.pledgePanel.port.on("pledged", function (siteInfo) {
      courtClerk.onPledge(siteInfo);
   });
   this.pledgePanel.port.on("cleared", function (siteInfo) {
      courtClerk.onClear(siteInfo);
   });

   this.pledgeButton = ui.ToggleButton({
    id: "pledge-button",
    label: "Pledge",
    icon: data.url("images/pledge_unsupported.png"),
    disabled: true,
    onChange: function(state) {
      if (state.checked)  {
        self.pledgePanel.show({
              position: self.pledgeButton
        });
      }
    },
   });
  },

  setCurrentSite: function (siteData) {
    this.currentSite = siteData;
    this._configureSiteUI();
  },

  _configureSiteUI: function () {
    // configure pledge button
    if (!this.currentSite || this.currentSite.host.startsWith("about::")) {
      this.pledgeButton.state("window", {
        disabled: true,
      });
      return;
    }

    if (this.currentSite.canPledge) {
      this.pledgeButton.state("window", {
        label: this.currentSite.site + " supports your pledge",
        icon: data.url("images/pledge_supported.png"),
        disabled: false,
      });
    }
    else {
      this.pledgeButton.state("window", {
        label: this.currentSite.site + " does not support pledges. But you can still pledge.",
        icon: data.url("images/pledge_unsupported.png"),
        disabled: false,
      });
    }
    // configure pledge panel
    this.pledgePanel.port.emit("siteInfo", this.currentSite);
  },
}

exports.PledgeButton = PledgeButton;
