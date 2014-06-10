"use strict";

let pledgedSitesApp = angular.module("pledgedSitesApp", []);

pledgedSitesApp.filter('escape', function() {
  return window.escape;
});

pledgedSitesApp.controller("pledgedSitesCtrl", function($scope) {
  $scope.pledgedSites = null;

  self.port.on("pledgedSites", function(pledgedSites) {
    $scope.$apply(_ => {
      $scope.pledgedSites = JSON.stringify(pledgedSites, null, "  ");
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
