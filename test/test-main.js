var tests = [];

for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/\/base\/test\/js\/.*\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

require.config({
  // Karma serves files from '/base'
  baseUrl: '/base/app/js',
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
  }
});

// prepend jquery to the lists of tests so that we have access to it
// for its promises.
tests.unshift("jquery");
require(tests, function(resolvedTests) {
  $.when.apply($, arguments).done(function() {
    console.log("running");
    window.__karma__.start();
  });
});
