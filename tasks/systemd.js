module.exports = function (grunt) {
  var os = require("os");
  var child = require("child_process");

  grunt.registerTask(
    "systemd",
    "Generate a valid systemd service file",
    function () {
      var template = grunt.file.read("tasks/lib/service.template");

      var NODE_VERSION = child
        .execSync("node -v", { encoding: "utf-8" })
        .trim()
        .replace("v", "");

      var env = {
        GOOGLE_OAUTH_CLIENT_ID: null,
        GOOGLE_OAUTH_CONSUMER_SECRET: null,
        NODE_VERSION,
        AP_API_KEY: null,
        AWS_SECRET_ACCESS_KEY: null,
        AWS_ACCESS_KEY_ID: null
      };

      for (var v in env) {
        if (env[v] === null) {
          env[v] = process.env[v];
        }
      }

      var home = os.homedir();
      var here = process.cwd();

      var data = { home, here, env };

      var output = grunt.template.process(template, data);

      grunt.file.write("elections.service", output);

      grunt.log.writeln("Wrote service file output to ./elections.service\n");
      grunt.log.writeln(
        "Run the command '$ sudo cp ./elections.service /etc/systemd/system/' to move this file into place\n"
      );
      grunt.log.writeln(
        "** The service is configured to deploy the app live, please edit the file by hand if you want to deploy to staging.\n"
      );
      grunt.log.writeln(
        "After editing the service file, reload the changes with `sudo systemctl daemon-reload` and the restart with 'sudo systemctl restart service_name'\n\n"
      );
    }
  );
};
