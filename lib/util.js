(function() {
  var LineBuffer, Stream, async, exec, fs, path, spawn;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice;
  fs = require("fs");
  path = require("path");
  async = require("async");
  exec = require("child_process").exec;
  spawn = require("child_process").spawn;
  Stream = require('stream').Stream;
  exports.LineBuffer = LineBuffer = (function() {
    __extends(LineBuffer, Stream);
    function LineBuffer(stream) {
      var self;
      this.stream = stream;
      this.readable = true;
      this._buffer = "";
      self = this;
      this.stream.on('data', function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return self.write.apply(self, args);
      });
      this.stream.on('end', function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return self.end.apply(self, args);
      });
    }
    LineBuffer.prototype.write = function(chunk) {
      var index, line, _results;
      this._buffer += chunk;
      _results = [];
      while ((index = this._buffer.indexOf("\n")) !== -1) {
        line = this._buffer.slice(0, index);
        this._buffer = this._buffer.slice(index + 1, this._buffer.length);
        _results.push(this.emit('data', line));
      }
      return _results;
    };
    LineBuffer.prototype.end = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length > 0) {
        this.write.apply(this, args);
      }
      if (this._buffer.length) {
        this.emit('data', this._buffer);
      }
      return this.emit('end');
    };
    return LineBuffer;
  })();
  exports.bufferLines = function(stream, callback) {
    var buffer;
    buffer = new LineBuffer(stream);
    buffer.on("data", callback);
    return buffer;
  };
  exports.mkdirp = function(dirname, callback) {
    var p;
    return fs.lstat((p = path.normalize(dirname)), function(err, stats) {
      var paths;
      if (err) {
        paths = [p].concat((function() {
          var _results;
          _results = [];
          while (p !== "/" && p !== ".") {
            _results.push(p = path.dirname(p));
          }
          return _results;
        })());
        return async.forEachSeries(paths.reverse(), function(p, next) {
          return path.exists(p, function(exists) {
            if (exists) {
              return next();
            } else {
              return fs.mkdir(p, 0755, function(err) {
                if (err) {
                  return callback(err);
                } else {
                  return next();
                }
              });
            }
          });
        }, callback);
      } else if (stats.isDirectory()) {
        return callback();
      } else {
        return callback("file exists");
      }
    });
  };
  exports.chown = function(path, owner, callback) {
    var chown, error;
    error = "";
    chown = spawn("chown", [owner, path]);
    chown.stderr.on("data", function(data) {
      return error += data.toString("utf8");
    });
    return chown.on("exit", function(code) {
      return callback(error, code === 0);
    });
  };
  exports.pause = function(stream) {
    var onClose, onData, onEnd, queue, removeListeners;
    queue = [];
    onData = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return queue.push(['data'].concat(__slice.call(args)));
    };
    onEnd = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return queue.push(['end'].concat(__slice.call(args)));
    };
    onClose = function() {
      return removeListeners();
    };
    removeListeners = function() {
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      return stream.removeListener('close', onClose);
    };
    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('close', onClose);
    return function() {
      var args, _i, _len, _results;
      removeListeners();
      _results = [];
      for (_i = 0, _len = queue.length; _i < _len; _i++) {
        args = queue[_i];
        _results.push(stream.emit.apply(stream, args));
      }
      return _results;
    };
  };
  exports.sourceScriptEnv = function(script, env, options, callback) {
    var command;
    if (options.call) {
      callback = options;
      options = {};
    } else {
      options != null ? options : options = {};
    }
    command = "" + options.before + ";\nsource '" + script + "' > /dev/null;\n'" + process.execPath + "' -e 'JSON.stringify(process.env)'";
    return exec(command, {
      cwd: path.dirname(script),
      env: env
    }, function(err, stdout, stderr) {
      if (err) {
        err.message = "'" + script + "' failed to load";
        err.stdout = stdout;
        err.stderr = stderr;
        callback(err);
      }
      try {
        return callback(null, JSON.parse(stdout));
      } catch (exception) {
        return callback(exception);
      }
    });
  };
}).call(this);
