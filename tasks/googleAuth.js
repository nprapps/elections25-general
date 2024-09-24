var { google } = require("googleapis");
var opn = require("opn");

var http = require("http");
var os = require("os");
var path = require("path");
var url = require("url");
var fs = require("fs");

const tokenLocation = path.join(os.homedir(), ".google_oauth_token");

const authenticate = function () {
  const tokens = fs.readFileSync(
    path.join(os.homedir(), ".google_oauth_token"),
    "utf-8"
  );
  const parsedTokens = JSON.parse(tokens);
  auth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CONSUMER_SECRET
  );
  auth.setCredentials(parsedTokens);

  auth.on("tokens", function (update) {
    Object.assign(parsedTokens, update);
    fs.writeFileSync(
      path.join(os.homedir(), ".google_oauth_token"),
      JSON.stringify(parsedTokens, null, 2)
    );
  });

  return auth;
};

authenticate();

var task = function (grunt) {
  grunt.registerTask(
    "google-auth",
    "Authenticates with Google for document download",
    function () {
      const done = this.async();

      const clientID = process.env.GOOGLE_OAUTH_CLIENT_ID;
      const secret = process.env.GOOGLE_OAUTH_CONSUMER_SECRET;

      const client = new google.auth.OAuth2(
        clientID,
        secret,
        "http://localhost:8000/authenticate/"
      );
      google.options({ auth: client });

      const scopes = [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
      ];

      const authURL = client.generateAuthUrl({
        access_type: "offline",
        scope: scopes.join(" "),
        prompt: "consent",
      });

      const onRequest = function (request, response) {
        response.setHeader("Connection", "close");
        if (request.url.indexOf("authenticate") > -1) {
          return onAuthenticated(request, response);
        } else if (request.url.indexOf("authorize") > -1) {
          response.setHeader("Location", authURL);
          response.writeHead(302);
        } else {
          response.writeHead(404);
        }
        response.end();
      };

      const onAuthenticated = async function (request, response) {
        const requestURL =
          request.url[0] == "/" ? "localhost:8000" + request.url : request.url;
        const query = new url.URL(requestURL).searchParams;
        const code = query.get("code");
        if (!code) return;
        try {
          const token = await client.getToken(code);
          const tokens = token.tokens;
          grunt.file.write(tokenLocation, JSON.stringify(tokens, null, 2));
          response.end("Authenticated, saving token to your home directory");
        } catch (err) {
          response.end(err);
        }

        done();
      };

      const server = http.createServer(onRequest);
      server.listen(8000, () => opn("http://localhost:8000/authorize"));
    }
  );
};

task.authenticate = authenticate;

module.exports = task;
