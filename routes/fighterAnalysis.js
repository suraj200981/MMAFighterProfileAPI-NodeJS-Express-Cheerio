const express = require("express");
const router = express.Router();
const randomUseragent = require("random-useragent");
const fs = require("fs");

router.get("/", async () => {
  // define a local variable to keep track of the current page number
  let userAgent = "";
  userAgent = randomUseragent.getRandom();

  // set req headers to random user agent
  req.headers["user-agent"] = userAgent;

  let firstName = req.query.firstName;
  let lastName = req.query.lastName;
});
