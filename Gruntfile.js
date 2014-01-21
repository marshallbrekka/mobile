var path = require('path');



module.exports = function(grunt) {
   function build(config, fn){
    var files = grunt.file.expand(config.src);
//    var styles = config.styles;
//    var processedStyles;
    //concat
    var src = files.map(function(filepath) {
      return grunt.file.read(filepath);
    }).join(grunt.util.normalizelf('\n'));
    //process
  //  var processed = this.process(src, grunt.config('NG_VERSION'), config.strict);
/*    if (styles) {
      processedStyles = this.addStyle(processed, styles.css, styles.minify);
      processed = processedStyles.js;
      if (config.styles.generateCspCssFile) {
        grunt.file.write(removeSuffix(config.dest) + '-csp.css', CSP_CSS_HEADER + processedStyles.css);
      }
    }*/
    //write
    grunt.file.write(config.dest, src);
    grunt.log.ok('File ' + config.dest + ' created.');
    fn();

    function removeSuffix(fileName) {
      return fileName.replace(/\.js$/, '');
    }
  }



  grunt.registerMultiTask('build', 'build JS files', function(){
    build(this.data, this.async());
  });

  grunt.initConfig({
    clean : {
      build : ["dist"]
    },
    build : {
      rfz : {
        dest : "dist/rfz.js",
        src : ["src/rfz.prefix", "src/**/*.js", "src/rfz.suffix"]
      }
    },
    sass: {
      dist: {
        files: {
          'dist/rfz.css': 'scss/rfz.scss',
        }
      }
    },
    watch : {
      scripts: {
        files: ['src/**/*.js'],
        tasks: ['build'],
        options: {
          spawn: false
        }
      },
      sass: {
        files: ['scss/**/*.scss'],
        tasks: ['sass'],
        options: {
          spawn: false
        }
      }
    }
  });
  require('load-grunt-tasks')(grunt);
  
  grunt.registerTask('build2', ['clean', 'build']);
};
