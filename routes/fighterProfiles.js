const express = require("express");
const router = express.Router();
const randomUseragent = require("random-useragent");
const fs = require("fs");

//import services
const findFighter = require("../services/findFighter.js");
const scrapeRecord = require("../services/scrapeRecord.js");

//jwt auth
const jsonwebtoken = require("jsonwebtoken");
const crypto = require("crypto");
let jwtSecret = crypto.randomBytes(64).toString("hex");

// this endpoint will scrape fighter profiles
router.get("/fighter", async (req, res) => {
  let token = req.headers.authorization;
  // console.log(token);
  try {
    const decoded = jsonwebtoken.verify(token, jwtSecret);

    // define a local variable to keep track of the current page number
    let userAgent = "";
    userAgent = randomUseragent.getRandom();
    // set req headers to random user agent
    req.headers["user-agent"] = userAgent;

    let firstName = req.query.firstName.toLowerCase();
    let lastName = req.query.lastName.toLowerCase();

    console.log("query params: " + firstName + lastName);

    // initialize a variable to keep track of whether the fighter name has been found
    let fighterNameFound = false;

    // define a function to scrape the fighter blocks from a single page
    function scrapePage(pageNumber) {
      let url = `https://www.sherdog.com/stats/fightfinder?association=&weightclass=&SearchTxt=${firstName}+${lastName}&page=${pageNumber}`;
      return findFighter.find(url, req);
    }

    // use a loop to repeatedly scrape the next page until the fighter name is found
    (async function loop() {
      let pageNumber = 1; // define pageNumber here
      while (!fighterNameFound) {
        console.log(`Searching page ${pageNumber}...`);
        try {
          let figherBlocks = await scrapePage(pageNumber);
          for (let i = 0; i < figherBlocks.length; i++) {
            // if the fighter name matches the query params
            if (
              figherBlocks[i].name.toLowerCase() ==
              (firstName + " " + lastName).toLowerCase()
            ) {
              // get the enhanced profile url
              let enhancedProfileUrlFoundOnPage =
                "https://www.sherdog.com" + figherBlocks[i].href;
              console.log(`Found profile at ${enhancedProfileUrlFoundOnPage}`);
              // set the flag to exit the loop
              fighterNameFound = true;
              // scrape the fighter's full profile
              await scrapeRecord.scrape(
                enhancedProfileUrlFoundOnPage,
                res,
                req
              );
              break;
            }
          }
          // increment the page number
          pageNumber++;
        } catch (error) {
          console.log(error);
        }
      }
    })();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

router.get("/token", (req, res) => {
  return res.json({
    bearer: jsonwebtoken.sign(Date.now().toString(), jwtSecret),
  });
});

//search for specific fighter
router.get("/search", (req, res) => {
  let fighterName = req.query.name;
  let json = JSON.parse(fs.readFileSync("FighterProfiles.json"));
  let fightersFound = [];
  let count = 0;

  for (let x = 0; x < json.length; x++) {
    count = 0;
    console.log(json[x].name);
    for (let k = 0; k < fighterName.length; k++) {
      if (
        fighterName.toLowerCase().charAt(k) ==
        json[x].name.toLowerCase().charAt(k)
      ) {
        count++;
      }
      if (count == fighterName.length) {
        fightersFound.push(json[x]); //pushing found profile
        count = 0;
      }
    }
  }

  // if (fightersFound.length === 0) {
  //   try {
  //     let response = await axios.get(`https://mma-fighter-profile-api-appdev.herokuapp.com/api/fighter?firstName=conor&lastName=mcgregor`, {
  //       headers: {
  //         authorization: req.headers.authorization,
  //       },
  //     });
  //     fightersFound = response.data;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  return res.send(fightersFound);
});

router.get("/all_profiles", (req, res) => {
  let json = fs.readFileSync("FighterProfiles.json");
  return res.send(json);
});

module.exports = router;
