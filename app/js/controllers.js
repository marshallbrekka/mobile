'use strict';

/* Controllers */

var pixelSize = document.getElementById("em-unit").clientHeight / 100;

function pixelToRelative(p) {
  return Math.floor(p / pixelSize);
}

function relativeToPixel(p) {
  return Math.floor(p * pixelSize);
}

function post($http, endpoint, data, fn) {
  $http.post(endpoint, data).success(fn);
}

function HomeCtrl($scope, $http, $location, $timeout) {
  var loading = true;
  
  $timeout(function() {
    $http.post("/e/series/many", {})
      .success(function(data){
        loading = false;
        $scope.results = data;
        console.log(data);
      })}, 2000);

  $scope.goToSeries = function(series) {
    $location.url("/series/" + series.id);
  };
 
  $scope.loading = function() {
    console.log("called loading");
    return loading;
  }
}

function SearchResults($scope, $http, $routeParams, $location) {
  $scope.search = $routeParams.search;
  $scope.results = null;
  post($http, "/e/series/search", {search : $scope.search, freebase : true},
       function(data) {
         $scope.results = data.results;
       });

  $scope.goToSeries = function(series) {
    $location.url("/series/" + series.id);
  }
}

function resetUploadScope($scope, steps) {
  $scope.step = steps[0];
  $scope.seriesMeta = null;
  $scope.title = "";
  $scope.canCancel = true;
  $scope.finishedUploading = false;
  $scope.files = [];
  $scope.uploadIndex = null;
  $scope.canUpload = false;
}


function startCurrent($scope) {
  var data = new FormData(),
  file = $scope.files[$scope.uploadIndex];
  data.append("file", file);
  data.append("series-id", $scope.seriesMeta.id);
  file.xhr.send(data);
}

function startNext($scope) {
  console.log("starting next upload");
  $scope.uploadIndex++;
  if($scope.uploadIndex === $scope.files.length) {
    console.log("finished uploading all files, calling next");
    $scope.finishedUploading = true;
    $scope.$apply();
  } else {
    startCurrent($scope);
  }
}

function upload($scope) {
  if(!$scope.uploadIndex) {
    $scope.uploadIndex = 0;
    $scope.videos = [];
  }
  var xhr;
  function onComplete(data) {
    $scope.videos[$scope.uploadIndex] = data;
    startNext($scope);
  }

  for (var i = 0; i < $scope.files.length; i++) {
    xhr = new XMLHttpRequest();
    xhr.open("POST", "/e/upload/file", true);
    xhr.addEventListener("load", onComplete, false);
    $scope.files[i].xhr = xhr;
  }
}

function UploadCtrl($scope, $http) {
  var steps = ["add-files", "uploading-files"];
  var stepIndex = 0;
  resetUploadScope($scope, steps);
  $scope.step = steps[0];
  var loading = false;
  $scope.search = function() {
    var input = $scope.input;
    if (input && input.length > 0) {
      loading = true;
      $scope.results = null;

      post($http, "/e/external/search", {input : input},
           function(data) {
             loading = false;
             $scope.results = data.results;
           });
    };
  };

  $scope.createSeries = function(series) {
    resetUploadScope($scope, steps);
    stepIndex = 0;
    $scope.seriesMeta = series;
    console.log(series);
  };

  $scope.loading = function() {
    return loading;
  }
  $scope.files = [];
  $scope.addFile = function(file) {
    $scope.files.push(file);
  }

  $scope.removeFile = function(index) {
    $scope.files.splice(index, 1);
  }

  $scope.canAddMore = function() {
    if($scope.seriesMeta && $scope.seriesMeta.show) {
      return true;
    } else if ($scope.files.length === 0) {
      return true;
    }
    return false;
  }

  $scope.canProceed = function() {
    if($scope.step === steps[0]) {
      return $scope.files.length > 0
    } else if($scope.step === steps[1]) {
      console.log("can proceed" + $scope.finishedUploading);
      return $scope.finishedUploading;
    }
    return true;
  }

  $scope.canGoBack = function() {
    return false;
  }

  $scope.next = function() {
    $scope.step = steps[++stepIndex];
    $scope.canCancel = false;
    if ($scope.step === steps[1]) {
      upload($scope);
      if (!$scope.seriesMeta.id) {
        post($http, "/e/series/create", $scope.seriesMeta,
             function(data) {
               $scope.seriesMeta.id = data.id;
               if ($scope.canUpload) {
                 startCurrent($scope);
               }
             });
      }
    }

    if (!$scope.step) {
      resetUploadScope($scope, steps);
    }
  }

  $scope.back = function() {
    $scope.step = steps[--stepIndex];
  }

  $scope.startUpload = function() {
    console.log("starting Upload");
    $scope.canUpload = true;
    if ($scope.seriesMeta.id) {
      startCurrent($scope);
    }
  }
         
}


function AppCtrl($scope) {
}




function SeriesCtrl($scope, $http, $routeParams) {
  
  function hasPlayable(series) {
    return series.titles.length > 0 &&
           series.titles[0].video.status === "converted";
  }

  function playableMovie(series) {
    return series.movie.video.status === "converted";
  }

  function playableShow(series) {
    return false;
  }

  function playableEpisode(title) {
    return title.video && 
           title.video.status === "converted";
  }

  $scope.playable = function() {
    if ($scope.series) {
      return $scope.series.show ? playableShow($scope.series) :
                                  playableMovie($scope.series);
    }
    return false;
  }

  $scope.playCurrent = function() {
    var s = $scope.series;
    if (!s.show) {
      window.location = "/player.html?" + s.movie.video.id;
    }
  }

  $scope.status = function() {
    if ($scope.series &&
        !$scope.series.show &&
        $scope.series.movie) {
      var video = $scope.series.movie.video;
      if(video.status !== "converted") {
        return "Status: file is " + video.status;
      }
    }
  }
 
  $http.post("/e/series/get", {id : parseInt($routeParams.series)}
            ).success(function(data) {
              console.log(data);
              $scope.series = data;
            });
}

function ShowCtrl($scope) {
  function compare(a, b) {
    if (a === b) return 0;
    if (a < b) return -1;
    return 1;
  }
  
  function sortKeys(obj) {
    var keys = Object.keys(obj);
    var filtered = [];
    var key;
    var knum;
    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      if (key !== "") {
        knum = parseInt(key);
        if (isNaN(knum)) {
          filtered.push(key);
        } else {
          if (knum !== 0) {
            filtered.push(knum);
          }
        }
      }
    }
    filtered.sort(compare);
    for (var i = 0; i < filtered.length; i++) {
      filtered[i] = "" + filtered[i];
    }
    return filtered;
  }

  var parent = $scope.$parent;

  function selectedSeasonList() {
    var ep = parent.series.seasons[$scope.selectedSeason];
    var keys = sortKeys(ep);
    var re = [];
    for (var i = 0; i < keys.length; i++) {
      re.push(ep[keys[i]]);
    }
    return re;
  }

  $scope.selectedSeason = sortKeys($scope.series.seasons)[0];
  $scope.seasons = sortKeys(parent.series.seasons);
  $scope.episodeList = selectedSeasonList();

  $scope.select = function(season) {
    console.log(parent.series.seasons[season]);
    $scope.selectedSeason = season;
    $scope.episodeList = selectedSeasonList();
  }

  $scope.selectEpisode = function(episode) {
    if (episode.video) {
      if (episode.video.status === "converted") {
        window.location = "/player.html?" + episode.video.id;
      } else {
        alert("Video status: " + episode.video.status);
      }
    } else {
      alert("There is no video for this episode yet");
    }
  };
}


function NavCtrl($scope, $http, $location) {
  $scope.changed = function() {
    if ($scope.search !== "") {
      $http.post('/e/series/search',
                 {"search" : $scope.search}).success(function(data) {
                   var arr = [];
                   for(var key in data.results) {
                     arr.push(data.results[key]);
                   }
                   $scope.results = arr;
                   console.log($scope.results);
                 });
    } 
  }

  $scope.parent = {};
  $scope.submit = function() {
    $location.url( "/search/" + $scope.parent.search);
    if (isGoogleTvBrowser()) $scope.parent.search = "";
  }

  $scope.go = function(url) {
    $location.url("/" + (url || ""));
  }
}

function AddMedia($scope) {
  
}
