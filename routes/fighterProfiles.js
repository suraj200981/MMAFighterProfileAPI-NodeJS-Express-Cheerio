const express = require("express");
const router = express.Router();
const randomUseragent = require("random-useragent");
const fs = require("fs");
const axios = require("axios");
const circularJSON = require("circular-json");

require("dotenv").config();

//passed mongo client to services
const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(process.env.URI_MONGO);
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

    console.log("query params to scrape: " + firstName + " " + lastName);

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
      let infinityLoopCount = 1;
      while (!fighterNameFound) {
        if (pageNumber == 27) {
          return res.status(400).json({ message: "Fighter not found" });
        }
        console.log(`Searching page ${pageNumber}...`);
        infinityLoopCount++; // increment
        if (infinityLoopCount > 10 && pageNumber == 1) {
          return res.status(400).json({ message: "Fighter not found" });
        }
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
router.get("/search", async (req, res) => {
  let fighterName = req.query.name.toLowerCase();
  let json;
  //get fighter profiles from mongo db and json parse it
  json = await findAllFighterProfiles(client);

  let fightersFound = [];
  let count = 0;

  let myArray = fighterName.split(" ");

  let firstName = myArray[0];
  let lastName = myArray[1];
  let bearer = "";

  if (firstName === undefined) {
    firstName = "";
  }
  if (lastName === undefined) {
    lastName = "";
  }

  for (let x = 0; x < json.length; x++) {
    count = 0;
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

  if (fightersFound.length === 0) {
    if (myArray.length === 0) {
      return res.status(400).json({ message: "Fighter name is required" });
    }
    try {
      let errorAtScrape = false;
      await axios
        .get(process.env.devEnvironmentGenerateToken)
        .then((response) => {
          bearer = response.data.bearer;
        })
        .catch((error) => {
          console.log(error);
        });

      //stores each fighter profile in mongo db
      await axios
        .get(
          `${process.env.devEnvironmentScrapeFighter}=${firstName}&lastName=${lastName}`,
          {
            headers: {
              authorization: bearer,
            },
          }
        )
        .then((response) => {
          console.log(response.data, "success");
          console.log("unsuccessful scrape");
        })
        .catch((error) => {
          console.log(error);
          console.log("successful scrape");
          errorAtScrape = true;
        });

      if (errorAtScrape) {
        return res.status(400).json({ message: "An error whilst scraping" });
      }
      await axios
        .get(`${process.env.devEnvironmentSearchFighter}=${fighterName}`)
        .then((response) => {
          console.log(response.data[0]);
          fightersFound.push(response.data[0]);
        })
        .catch((error) => {
          console.log(error);
          return res.status(400).json({ message: "An error occured" });
        });

      return res.send(fightersFound);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "An error occured" });
    }
  } else {
    finalFightersFound = fightersFound.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
    });
    return res.send(finalFightersFound);
  }
});

router.get("/all_profiles", (req, res) => {
  let json;

  //get fighter profiles from mongo db and json parse it
  client.connect((err) => {
    const db = client.db("FighterProfiles");
    const collection = db.collection("FighterProfilesCollection");

    collection.find({}).toArray((err, docs) => {
      if (err) {
        console.log(err);
      } else {
        json = docs;
        return res.send(json);
      }
    });
  });
});

//delete all profiles by specific fighter name
router.get("/deleteProfile", async (req, res) => {
  //delete profile from mongo db
  const db = client.db("FighterProfiles");
  const collection = db.collection("FighterProfilesCollection");
  await collection
    .deleteMany({ name: "Tom Aaron" })
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.log(error);
    });
  return res.send("profile deleted successfully for " + req.query.name);
});

router.get("/allNames", async (req, res) => {
  let json;

  //get fighter profiles from mongo db and json parse it
  json = await findAllFighterProfiles(client);

  let resultArr = [];

  for (let x = 0; x < json.length; x++) {
    resultArr.push(json[x].name);
  }

  return res.send(resultArr);
});

async function findAllFighterProfiles(client) {
  const db = client.db("FighterProfiles");
  const collection = db.collection("FighterProfilesCollection");
  return await collection.find({}).toArray();
}

module.exports = router;
