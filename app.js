//------------------------------------------------------------------------------
// Copyright 2016 IBM Corp. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------

const express = require("express");
const routes = require("./routes");
const http = require("http");
const path = require("path");
const ibmdb = require("ibm_db");
const morgan = require("morgan");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("cf-deployment-tracker-client").track();

var app = express();

// all environments
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
morgan("tiny");
app.use(express.json());
app.use(express.urlencoded());
app.use(methodOverride("X-HTTP-Method-Override"));
app.use(cookieParser("your secret here"));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(app.router);
app.use(express.static(path.join(__dirname, "public")));
var db2;
var hasConnect = false;

// development only
if ("development" == app.get("env")) {
  app.use(express.errorHandler());
}

if (process.env.CE_SERVICES) {
  var env = JSON.parse(process.env.CE_SERVICES);
  if (env["dashDB"]) {
    hasConnect = true;
    db2 = env["dashDB"][0].credentials;
  }
}

if (!hasConnect) {
  db2 = {
    db: "BLUDB",
    hostname: "xxxx",
    port: 50000,
    username: "xxx",
    password: "xxx",
  };
}

var connString =
  "DRIVER={DB2};DATABASE=" +
  db2.db +
  ";UID=" +
  db2.username +
  ";PWD=" +
  db2.password +
  ";HOSTNAME=" +
  db2.hostname +
  ";port=" +
  db2.port;

app.get("/", routes.listSysTables(ibmdb, connString));

http.createServer(app).listen(app.get("port"), function () {
  console.log("Express server listening on port " + app.get("port"));
});
