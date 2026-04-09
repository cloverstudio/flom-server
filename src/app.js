// src/app.js
const path = require("path");
const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const compression = require("compression");
const cookieParser = require("cookie-parser");
const { Config, Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const loadRoutes = require("./api");

const app = express();
const router = express.Router();

app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(
  session({
    genid: function (req) {
      return Utils.getRandomString(32);
    },
    secret: Config.sessionsalt,
    store: new RedisStore(Config.redis),
    resave: true,
    saveUninitialized: true,
    cookie: {
      path: "/",
      httpOnly: false,
      secure: false,
      maxAge: null,
    },
  }),
);

function isAnyElementMeetingCondition(arr, condition) {
  for (let i = 0; i < arr.length; i++) {
    if (condition(arr[i])) {
      return true;
    }
  }
  return false;
}

app.use(function (req, res, next) {
  const allowedOrigins = [
    ".flom.dev",
    ".flom.app",
    "localhost",
    "https://192.168",
    "http://192.168",
    "10.",
  ];

  const origin = req.headers.origin;
  if (
    origin &&
    isAnyElementMeetingCondition(allowedOrigins, (allowedOrigin) => origin?.includes(allowedOrigin))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "PUT, PATCH, GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, access-token, device-type, credentials",
  );
  res.setHeader("Access-Control-Allow-Credentials", true);

  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    req.originalUrl.includes("/big/") &&
    (!req.headers["content-length"] || +req.headers["content-length"] > 1024 * 1024 * 500)
  ) {
    res.sendStatus(413);
    return;
  }

  if (req.cookies && req.cookies["access-token"]) {
    req.headers["access-token"] = req.cookies["access-token"];
  }

  if (
    req.originalUrl !== "/" &&
    !req.originalUrl.includes("livestreams/cb") &&
    !req.originalUrl.includes("uploads")
  ) {
    logger.info("method: " + req.method + " | url: " + req.originalUrl);
  }
  next();
});

app.use("/uploads", express.static(Config.uploadPath, { maxAge: Const.publicFolderCacheTime }));
app.use("/", express.static(Config.publicPath, { maxAge: Const.publicFolderCacheTime }));
app.use(function (request, response, next) {
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, access-token, apikey, device-type, credentials",
  );
  response.setHeader("Access-Control-Allow-Credentials", true);

  response.lang = request.headers["lang"] || "en";

  if (request.cookies && request.cookies["access-token"]) {
    request.headers["access-token"] = request.cookies["access-token"];
  }

  next();
});

app.use(function (request, response, next) {
  if (request.originalUrl !== "/") {
    const headers = {};
    Object.keys(request.headers).forEach((header) => {
      if (!Const.ignoredHeaders.includes(header.toLowerCase())) {
        headers[header] = request.headers[header];
      }
    });

    if (
      !request.originalUrl.includes("livestreams/cb") &&
      !request.originalUrl.includes("uploads")
    ) {
      if (
        request.originalUrl.includes("app/startup") ||
        request.originalUrl.includes("user/sync")
      ) {
        logger.debug(`Headers: ${JSON.stringify(headers)}`);
      } else {
        logger.debug(`Headers: ${JSON.stringify(headers)}`);
        logger.debug(`Body: ${JSON.stringify(request.body)}`);
      }
    }
  }
  next();
});

router.use("/apple-app-site-association", function (request, response) {
  response.header("Content-Type", "application/pkcs7-mime");
  response.send(
    JSON.stringify({
      applinks: {
        apps: [],
        details: [
          {
            appID: "P9KRM45QZL.com.qrios.flom.messenger",
            paths: ["*"],
          },
        ],
      },
    }),
  );
});

router.use("/api/v2", loadRoutes());
app.use("/", router);

app.use(function (req, res, next) {
  // return index.html
  res.sendFile(path.resolve(Config.publicPath, "index.html"));
});

module.exports = app;
