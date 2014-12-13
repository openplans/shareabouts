module.exports = function(grunt) {

  grunt.initConfig({
    dirs: {
      // Configurable paths
      src: 'src/sa_web/static',
      dest: 'src/sa_web/static/dist'
    },

    concat: {
      distjs: {
        options: {separator: ';'},
        files: {
          '<%= dirs.dest %>/preload.js': ['<%= dirs.src %>/js/utils.js',
                                          '<%= dirs.src %>/js/template-helpers.js'],
          '<%= dirs.dest %>/app.js':     ['<%= dirs.src %>/js/handlebars-helpers.js',
                                          '<%= dirs.src %>/js/models.js',
                                          '<%= dirs.src %>/js/views/pages-nav-view.js',
                                          '<%= dirs.src %>/js/views/auth-nav-view.js',
                                          '<%= dirs.src %>/js/views/activity-view.js',
                                          '<%= dirs.src %>/js/views/app-view.js',
                                          '<%= dirs.src %>/js/views/layer-view.js',
                                          '<%= dirs.src %>/js/views/map-view.js',
                                          '<%= dirs.src %>/js/views/support-view.js',
                                          '<%= dirs.src %>/js/views/survey-view.js',
                                          '<%= dirs.src %>/js/views/place-detail-view.js',
                                          '<%= dirs.src %>/js/views/place-form-view.js',
                                          '<%= dirs.src %>/js/views/place-list-view.js',
                                          '<%= dirs.src %>/js/views/geocode-address-view.js',
                                          '<%= dirs.src %>/js/routes.js']
        }
      },
      distcss: {
        options: {separator: '\n'},
        files: {
          '<%= dirs.dest %>/app.css': ['<%= dirs.src %>/css/normalize.css',
                                       '<%= dirs.src %>/css/default.css',
                                       '<%= dirs.src %>/css/custom.css']
        }
      }
    },

    uglify: {
      distjs: {
        files: {
          '<%= dirs.dest %>/libs.min.js': ['<%= dirs.src %>/libs/underscore.js',
                                           '<%= dirs.src %>/libs/backbone.js',
                                           '<%= dirs.src %>/libs/backbone.marionette.js',
                                           '<%= dirs.src %>/libs/handlebars-1.0.0.js',
                                           '<%= dirs.src %>/libs/moment-with-locales.min.js',
                                           '<%= dirs.src %>/libs/json2.js',
                                           '<%= dirs.src %>/libs/leaflet.argo.js',
                                           '<%= dirs.src %>/libs/binaryajax.js',
                                           '<%= dirs.src %>/libs/exif.js',
                                           '<%= dirs.src %>/libs/load-image.js',
                                           '<%= dirs.src %>/libs/canvas-to-blob.js',
                                           '<%= dirs.src %>/libs/spin.min.js',
                                           '<%= dirs.src %>/libs/gatekeeper.js',
                                           '<%= dirs.src %>/libs/swag.min.js',
                                           '<%= dirs.src %>/libs/jquery.scrollTo.js',
                                           '<%= dirs.src %>/libs/handlebars-helpers.js']
        }
      }
    },

    copy: {
      distcssimages: {
        expand: true,
        cwd: '<%= dirs.src %>/css/',
        src: '{,*/}*.{gif,jpeg,jpg,png,svg,webp}',
        dest: '<%= dirs.dest %>/',
      },
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', [
    'concat',
    'uglify',
    'copy'
  ]);

};