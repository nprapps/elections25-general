var fs = require("fs");
var path = require("path");
var util = require("util");
var chalk = require("chalk");
var gzip = require("zlib").gzip;
var mime = require("mime");
var s3 = require("./lib/s3");

function getDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day =`${date.getDate()}`.padStart(2, '0');
  const hours =`${date.getHours()}`.padStart(2, '0');
  const minutes =`${date.getMinutes()}`.padStart(2, '0');
  const seconds =`${date.getSeconds()}`.padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

var join = (...parts) => path.join(...parts).replace(/\\/g, "/");
var formatSize = function (input) {
  if (input > 1024 * 1024) {
    return Math.round((input * 10) / (1024 * 1024)) / 10 + "MB";
  }
  if (input > 1024) {
    return Math.round(input / 1024) + "KB";
  }
  return input + "B";
};

var cut = (str, max) => {
  if (str.length > max) {
    var half = max / 2;
    return str.slice(0, half) + "..." + str.slice(-half);
  }
  return str;
};

var gzippable = [
  "js",
  "html",
  "json",
  "map",
  "css",
  "txt",
  "csv",
  "svg",
  "geojson",
];

var zip = function (buffer) {
  return new Promise((ok, fail) => {
    gzip(buffer, (err, result) => {
      if (err) return fail(err);
      ok(result);
    });
  });
};

module.exports = function (grunt) {

  var findBuiltFiles = function () {
    var pattern = ["**/*.json", "!timed/**/*"];
    var files = grunt.file.expand({ cwd: "temp", filter: "isFile" }, pattern);
    var list = files.map(function (file) {
      var buffer = fs.readFileSync(path.join("temp", file));
      return {
        path: file,
        buffer: buffer,
      };
    });
    return list;
  };

  grunt.registerTask(
    "backup",
    "Backup data files to s3",
    function (deploy) {
      var done = this.async();
      deploy = deploy || "backup";

      var bucketConfig;
      switch (deploy) {
        case "simulated":
          bucketConfig = {
            path: "SIMULATION",
          };
          break;

        case "backup":
          bucketConfig = require("../backup-config.json");
          break;
      }

      //strip slashes for safety
      bucketConfig.path = bucketConfig.path.replace(/^\/|\/$/g, "");
      if (!bucketConfig.path) {
        grunt.fail.fatal(
          "You must specify a destination path in your project.json."
        );
      }

      var BATCH_SIZE = 10;

      var uploads = findBuiltFiles();

      var uploadProcess = async function () {
        var time = getDateString() + "/";
        for (var i = 0; i < uploads.length; i += BATCH_SIZE) {
          var batch = uploads.slice(i, i + BATCH_SIZE);

          var puts = batch.map(async function (upload) {
            var putObject = {
              Bucket: bucketConfig.bucket,
              Key: join(
                bucketConfig.path,
                upload.path.replace(/^/, time)
              ),
              Body: upload.buffer,
              ACL: "public-read",
              ContentType: mime.getType(upload.path),
              CacheControl: "public, max-age=1800",
            };

            var isCompressed = false;
            var extension = upload.path.split(".").pop();
            if (gzippable.includes(extension)) {
              putObject.Body = await zip(upload.buffer);
              putObject.ContentEncoding = "gzip";
              isCompressed = true;
            }

            var before = upload.buffer.length;
            var after = putObject.Body.length;
            var logString = isCompressed ? "- %s - %s %s %s (%s)" : "- %s - %s";

            var abbreviated = putObject.Key.split("/")
              .map((w) => cut(w, 30))
              .join("/");

            var args = [logString, abbreviated, chalk.cyan(formatSize(before))];
            if (isCompressed) {
              args.push(
                chalk.yellow("=>"),
                chalk.cyan(formatSize(after)),
                chalk.bold.green(
                  Math.round((after / before) * 100).toFixed(1) + "% via gzip"
                )
              );
            }
            console.log(...args);
            if (deploy == "simulated") return;
            return s3.upload(putObject);
          });

          await Promise.all(puts);
        }
      };

      console.log("All files uploaded successfully");
      
      uploadProcess().then(done);
    }
  );
};
