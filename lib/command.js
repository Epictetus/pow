(function() {
  var Configuration, Daemon, Installer, sys, usage, _ref;
  _ref = require(".."), Daemon = _ref.Daemon, Configuration = _ref.Configuration, Installer = _ref.Installer;
  sys = require("sys");
  process.title = "pow";
  usage = function() {
    console.error("usage: pow [--install-local | --install-system [--dry-run]]");
    return process.exit(-1);
  };
  Configuration.getUserConfiguration(function(err, configuration) {
    var arg, createInstaller, daemon, dryRun, installer, _i, _len, _ref;
    if (err) {
      throw err;
    }
    createInstaller = null;
    dryRun = false;
    _ref = process.argv.slice(2);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      if (arg === "--install-local") {
        createInstaller = Installer.getLocalInstaller;
      } else if (arg === "--install-system") {
        createInstaller = Installer.getSystemInstaller;
      } else if (arg === "--dry-run") {
        dryRun = true;
      } else {
        usage();
      }
    }
    if (dryRun && !createInstaller) {
      return usage();
    } else if (createInstaller) {
      installer = createInstaller(configuration);
      if (dryRun) {
        return installer.needsRootPrivileges(function(needsRoot) {
          var exitCode;
          exitCode = needsRoot ? 1 : 0;
          return installer.getStaleFiles(function(files) {
            var file, _i, _len;
            for (_i = 0, _len = files.length; _i < _len; _i++) {
              file = files[_i];
              sys.puts(file.path);
            }
            return process.exit(exitCode);
          });
        });
      } else {
        return installer.install(function(err) {
          if (err) {
            throw err;
          }
        });
      }
    } else {
      daemon = new Daemon(configuration);
      return daemon.start();
    }
  });
}).call(this);
