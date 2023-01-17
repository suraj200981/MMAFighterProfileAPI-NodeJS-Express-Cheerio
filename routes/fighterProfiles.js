const express = require("express");
const router = express.Router();
const randomUseragent = require("random-useragent");
const fs = require("fs");

const findFighter = require("../services/findFighter.js");

const scrapeRecord = require("../services/scrapeRecord.js");

// this endpoint will scrape fighter profiles
router.get("/fighter", async (req, res) => {
  // define a local variable to keep track of the current page number
  let userAgent = "";
  userAgent = randomUseragent.getRandom();
  // set req headers to random user agent
  req.headers["user-agent"] = userAgent;

  let firstName = req.query.firstName;
  let lastName = req.query.lastName;

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
            await scrapeRecord.scrape(enhancedProfileUrlFoundOnPage, res, req);
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
});

router.get("/all_profiles", (req, res) => {
  let json = fs.readFileSync("FighterProfiles.json");
  return res.send(json);
});

module.exports = router;
