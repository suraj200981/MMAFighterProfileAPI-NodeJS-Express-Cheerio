const express = require("express");
const router = express.Router();
const randomUseragent = require("random-useragent");
const fs = require("fs");

//take 2 fighters and compare them
router.get("/", async (req, res) => {
  // define a local variable to keep track of the current page number
  let userAgent = "";
  userAgent = randomUseragent.getRandom();
  // set req headers to random user agent
  req.headers["user-agent"] = userAgent;

  let fighterOne = req.query.FighterOne.toLowerCase();
  let fighterTwo = req.query.FighterTwo.toLowerCase();

  console.log(fighterOne, "logging from server");
  console.log(fighterTwo, "logging from server");

  if (res.statusCode == 200) {
    return res.send("success");
  } else {
    return res.send("something went wrong");
  }
});

module.exports = router;
