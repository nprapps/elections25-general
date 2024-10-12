/*

 Replays a recorded AP test (recorded via timed_backup.py)

 To run this task
 1. Put the backup folder for the test you want in the /temp folder
 2. run `grunt replay --offline`

 Optional flag:
 --seconds=## (the time interval to update the data; default is 60 seconds)
 
*/

module.exports = function (grunt) {
  const fs = require("fs");
  const path = require("path");

  function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    const entries = fs.readdirSync(src);

    entries.forEach(entry => {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);

      // dir or file?
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  grunt.registerTask("datashuffle", async function () {
    var task = async function () {
      const rootDir = "temp/";
      let dataDirectory = fs.readdirSync("temp/");
      let rootFiles = dataDirectory.filter(file =>
        fs.statSync(path.join("temp/", file)).isFile()
      );
      const restoreDir = path.join("temp/", "restore");

      const testDirectoryName = dataDirectory.filter(
        file =>
          fs.statSync(path.join("temp/", file)).isDirectory() &&
          file != "restore"
      );

      if (testDirectoryName.length === 0) {
        grunt.fail.warn("No test directory found!");
      }

      // if test directory is empty, restore files from temp directory, and stop running
      const testDirectory = path.join(rootDir, testDirectoryName[0]);
      const snapshots = fs
        .readdirSync(testDirectory)
        .filter(file =>
          fs.statSync(path.join(testDirectory, file)).isDirectory()
        )
        .sort();

      if (snapshots.length === 0) {
        rootFiles.forEach(file => {
          const filePath = path.join("temp/", file);
          fs.rmSync(filePath);
          grunt.log.writeln(`Removed ${file}`);
        });

        copyDirectory(restoreDir, rootDir);
        fs.rmSync(restoreDir, { recursive: true });
        grunt.fail.warn("Test complete. Previous data restored.");
      }

      // make restore directory to restore beginning state after test
      if (!fs.existsSync(restoreDir)) {
        fs.mkdirSync(restoreDir);
        fs.mkdirSync(path.join(restoreDir, testDirectoryName[0]));

        if (rootFiles.length != 0) {
          rootFiles.forEach(file => {
            const filePath = path.join("temp/", file);
            const newFilePath = path.join(restoreDir, file);
            if (path.extname(newFilePath) === ".json") {
              fs.renameSync(filePath, newFilePath);
              grunt.log.writeln(`Moved ${file} to restore directory`);
            }
          });
        }
      }
      // clear out temp directory files
      dataDirectory = fs.readdirSync("temp/");
      rootFiles = dataDirectory.filter(file =>
        fs.statSync(path.join("temp/", file)).isFile()
      );
      if (rootFiles.length != 0) {
        console.log("removing files: ", rootFiles)
        rootFiles.forEach(file => {
          const filePath = path.join("temp/", file);
          fs.rmSync(filePath);
          grunt.log.writeln(`Removed ${file}`);
        });
      }

      // get earliest snapshot from test
      const earliestSnapshot = snapshots[0];
      const earliestSnapshotPath = path.join(testDirectory, earliestSnapshot);

      const earliestSnapshotFiles = fs.readdirSync(earliestSnapshotPath);
      earliestSnapshotFiles.forEach(file => {
        const sourcePath = path.join(earliestSnapshotPath, file);
        const destPath = path.join(rootDir, file);
        if (path.extname(sourcePath) === ".json") {
          fs.copyFileSync(sourcePath, destPath);
          grunt.log.writeln(
            `Copied ${file} from ${earliestSnapshotPath} to ${destPath}`
          );
        }
      });
      // move test data to restoreDir
      const destDirectory = path.join(
        restoreDir,
        testDirectoryName[0],
        earliestSnapshot
      );
      fs.renameSync(earliestSnapshotPath, destDirectory);
    };

    const done = this.async();

    task().then(done);
  });
};
