App.directive("dropFiles", function() {
  function stopEvent(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function canUploadType(scope, file) {
    var ext = file.name.match(".([a-z0-9]{1,10})$");
    return ext !== null && ext.length === 2 && scope.allowedTypes.indexOf(ext[1]) !== -1;
  }

  function addFile(scope, fileEntry) {
    fileEntry.file(function(f) {
      if (canUploadType(scope, f)) {
        scope.fileHandler(f);
        scope.$apply();
      }
    });
  }

  function readDirectory(scope, dirEntry) {
    dirEntry.createReader()
      .readEntries(function(entries) {
        handleEntries(scope, entries);
      });
  }

  function handleEntries(scope, entries) {
    var entry;
    for(var i = 0; i < entries.length; i++) {
      entry = entries[i];
      if (entry.isFile) {
        addFile(scope, entry);
      } else if (entry.isDirectory) {
        readDirectory(scope, entry);
      }
    }
  }

  function handleFiles(e) {
    var items = e.dataTransfer.items,
        entries = [];
    for (var i = 0; i < items.length; i++) {
      entries[i] = items[i].webkitGetAsEntry();
    }
    return entries;
  }

  function handleInputFiles(scope, el) {
    var files = el[0].files;
    for (var i = 0; i < files.length; i++) {
      if (canUploadType(scope, files[i])) {
        scope.fileHandler(files[i]);
      }
    }
    scope.$apply();
  }

  function setupFileInput(scope, el) {
    var reEl = angular.element("<input type='file' multiple='true'/>");
    el.el.replaceWith(reEl);
    el.el = reEl;
    reEl.bind("change", function() {
      handleInputFiles(scope, reEl);
      setupFileInput(scope, el);
    });
  }

  return {
    restrict : "A",
    scope : {
      fileHandler : "=",
      enabled : "&",
    },
    transclude : true,
    template : "<span ng-transclude></span>, <span></span><button>or select files...</button>",
    link : function(scope, el, attrs) {
      scope.allowedTypes = attrs.filetypes.split(" ");
      var fileInput = {el : el.children().eq(1)};
      setupFileInput(scope, fileInput);
      el.children().eq(2).bind("click", function(e) {
        fileInput.el[0].click();
      });

      console.log(scope);
      el.bind("dragenter", function(e) {
        el.addClass("hover");
        stopEvent(e);
      })
      .bind("dragleave", function(e) {
        console.log("exiting");
        el.removeClass("hover");
        stopEvent(e);
      })
      .bind("dragover", stopEvent)
      .bind("drop", function(e) {
        stopEvent(e);
        el.removeClass("hover");
        if (scope.enabled()) {
          handleEntries(scope, handleFiles(e.originalEvent));
        }
      });
    }
  };
});
