"use strict";

let pledgedSitesApp = angular.module("pledgedSitesApp", []);

pledgedSitesApp.filter('escape', function() {
  return window.escape;
});

pledgedSitesApp.controller("pledgedSitesCtrl", function($scope) {
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
      $scope.pledgedSites = pledgeData.pledgedSites;
      $scope.pledgedSitesKeys = Object.keys(pledgeData.pledgedSites);
      $scope.monthlyPledgeAmount = pledgeData.pledgedAmount;
      let totalPoints = 0;
      $scope.pledgedSitesKeys.forEach((host) => {
        totalPoints += pledgeData.pledgedSites[host].pledged;
      });
      $scope.pledgedSitesKeys.forEach((host) => {
        let siteInfo = pledgeData.pledgedSites[host];
        siteInfo.dollars = Math.round(siteInfo.pledged / totalPoints * pledgeData.pledgedAmount * 100) / 100 || 0;
      });
      $scope.pledgedSitesStr = JSON.stringify($scope.pledgedSites);
    });
  });

});

pledgedSitesApp.controller("pledgePanelCtr", function($scope) {
  $scope.pledge = function pledge() {
    self.port.emit("pledged", $scope.siteInfo);
  }

  $scope.clear = function clear() {
    self.port.emit("cleared", $scope.siteInfo);
  }

  self.port.on("siteInfo", function(siteData) {
    $scope.$apply(_ => {
      $scope.siteInfo = siteData;
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
