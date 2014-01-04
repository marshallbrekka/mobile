require.config({
  baseUrl: "js",
  paths : {
    "lib/angular/angular" : "lib/angular/angular-1.2.6",
    "lib/angular/angular-animate" : "lib/angular/angular-animate-1.2.6",
    "lib/underscore" : "lib/underscore",
    "lib/jquery" : "lib/jquery-1.9.1"
  },
  shim : {
    "lib/angular/angular" : {
      exports : "angular"
    },
    "lib/angular/angular-animate" : {
      requires : ["lib/angular/angular"]
    },
    "lib/underscore" : {
      exports : "_"
    },
    "lib/jquery" : {
      exports : "$"
    }
  },
  config : {}
  
/*    paths: {
        "some": "some/v1.0"
    },
    waitSeconds: 15*/
  });
  require( ["lib/angular/angular", "app", "config/rfz", "utils/scrollView"],
    function(angular, app, RFZ, ScrollView) {
      console.log("RAN");
      angular.element(document).ready(function() {
//         angular.module('RFZ', []);
         angular.bootstrap(document, ['RFZ']);
/*        new ScrollView({container : document.getElementsByTagName("html")[0],
                        content : document.getElementsByTagName("body")[0]});*/
       });
        //This function will be called when all the dependencies
        //listed above are loaded. Note that this function could
        //be called before the page is loaded.
        //This callback is optional.
      return {};
    }
  );
