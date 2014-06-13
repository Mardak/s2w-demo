"use strict";

let pledgedSitesApp = angular.module("pledgedSitesApp", []);

pledgedSitesApp.filter('escape', function() {
  return window.escape;
});

pledgedSitesApp.controller("pledgedSitesCtrl", function($scope) {
  $scope.pledgedSites = null;

  $scope.clear = function clear(site) {
    if (window.confirm(site + " will be removed from you pledges starting next month")) {
      self.port.emit("unpledge", site);
    }
  }

  $scope.monthlyPledge = function monthlyPledge() {
    self.port.emit("next-month-pledge-amount", $scope.nextMonthPledgeAmount);
  }

  self.port.on("pledgedSites", function(pledgeData) {
    $scope.$apply(_ => {
      $scope.pledgedSites = pledgeData.sites;
      $scope.pledgedSitesKeys = Object.keys(pledgeData.sites);
      $scope.monthlyPledgeAmount = pledgeData.amount;
      $scope.nextMonthPledgeAmount = pledgeData.nextMonthAmount || pledgeData.amount;
      $scope.pledgedSitesKeys.forEach((host) => {
        let siteInfo = pledgeData.sites[host];
        siteInfo.dollars = Math.round(pledgeData.amount * siteInfo.percentage) / 100 || 0;
      });
      $scope.pledgedSitesStr = JSON.stringify($scope.pledgedSites);
    });
  });
});

pledgedSitesApp.controller("pledgedSitesCtrlDebug", function($scope) {
  $scope.pledgedSites = null;

  $scope.pledge = function pledge(site) {
    self.port.emit("pledged", site);
  }

  $scope.clear = function clear(site) {
    self.port.emit("cleared", site);
  }

  $scope.monthlyPledge = function monthlyPledge() {
    self.port.emit("monthly-amount", $scope.monthlyPledgeAmount);
  }

  self.port.on("pledgedSites", function(pledgeData) {
    $scope.$apply(_ => {
      $scope.pledgedSites = pledgeData.sites;
      $scope.pledgedSitesKeys = Object.keys(pledgeData.sites);
      $scope.monthlyPledgeAmount = pledgeData.amount;
      $scope.pledgedSitesKeys.forEach((host) => {
        let siteInfo = pledgeData.sites[host];
        siteInfo.dollars = Math.round(pledgeData.amount * siteInfo.percentage) / 100 || 0;
      });
      $scope.pledgedSitesStr = JSON.stringify($scope.pledgedSites);
    });
  });
});

pledgedSitesApp.controller("pledgePanelCtr", function($scope) {
  $scope.pledge = function pledge() {
    self.port.emit("pledged", $scope.siteInfo);
  }

  self.port.on("siteInfo", function(siteData) {
    $scope.$apply(_ => {
      $scope.siteInfo = siteData;
      $scope.showButton = (siteData.pledged ? siteData.pledged <= 0: true);
    });
  });
});

angular.bootstrap(document, ['pledgedSitesApp']);

// Low-level data injection
self.port.on("style", function(file) {
  let link = document.createElement("link");
  link.setAttribute("href", file);
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  document.head.appendChild(link);
});
