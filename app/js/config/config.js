require.config({
  baseUrl: "js",
  paths : {
    "angular" : "lib/angular/angular",
    "underscore" : "lib/underscore",
    "jquery" : "lib/jquery-1.9.1"
  },
  shim : {
    angular : {
      exports : "angular"
    },
    underscore : {
      exports : "_"
    },
    jquery : {
      exports : "$"
    }
  },
  config : {}
  
/*    paths: {
        "some": "some/v1.0"
    },
    waitSeconds: 15*/
  });
  require( ["angular", "app", "jquery", "config/rfz"],
    function(angular, app, $, RFZ) {
      console.log("RAN");
      angular.element(document).ready(function() {
//         angular.module('RFZ', []);
         angular.bootstrap(document, ['RFZ']);
       });
        //This function will be called when all the dependencies
        //listed above are loaded. Note that this function could
        //be called before the page is loaded.
        //This callback is optional.
      return {};
    }
  );
