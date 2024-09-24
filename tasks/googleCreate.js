var { google } = require("googleapis");
var { authenticate } = require("./googleAuth");
var opn = require("opn");

module.exports = function (grunt) {
  const mimes = {
    sheets: "application/vnd.google-apps.spreadsheet",
    docs: "application/vnd.google-apps.document",
  };

  grunt.registerTask(
    "google-create",
    "Create a linked Drive file (i.e., Google Sheets or Docs)",
    async function () {
      const done = this.async();

      const config = grunt.file.readJSON("project.json");
      const package = grunt.file.readJSON("package.json");
      let auth;
      try {
        auth = authenticate();
      } catch (err) {
        console.log(err);
        return grunt.fail.warn(
          "Couldn't load access token for Docs, try running `grunt google-auth`"
        );
      }
      const drive = google.drive({ auth, version: "v3" });

      const type = grunt.option("type");
      if (!type || !(type in mimes))
        return grunt.fail.warn("Please specify --type=sheets or --type=docs");
      const mimeType = mimes[type];

      const name = grunt.option("name") || package.name;

      const result = await drive.files.create({ resource: { name, mimeType } });
      const file = result.data;

      if (!config[type]) config[type] = type == "docs" ? {} : [];
      if (type == "docs") {
        config.docs[name] = file.id;
      } else {
        config.sheets.push(file.id);
      }
      grunt.file.write("project.json", JSON.stringify(config, null, 2));

      opn(`https://drive.google.com/open?id=${file.id}`);

      done();
    }
  );
};
