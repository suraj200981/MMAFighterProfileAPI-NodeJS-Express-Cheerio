const express = require("express");
const request = require("request");
const cheerio = require("cheerio");
const randomUseragent = require("random-useragent");
const fs = require("fs");

const app = express();

let data = [];

//home endpoint
app.get("/api", (req, res) => {
  let userAgent = "";
  userAgent = randomUseragent.getRandom();
  //set req headers to random user agent
  req.headers["user-agent"] = userAgent;

  let html = `<h1>Welcome to MMA fighter API by Suraj Sharma</h1>
    <br><br>
    <br>
    <ul style="display:inline;">
    <li style="display:inline;"><a href="http://localhost:8080/api">Home</a></li>
    <li style="display:inline;"><a href="http://localhost:8080/api/fighter">Fighter profile</a></li>
    </ul>`;

  res.send(html);
});

// this endpoint will scrape fighter profiles
app.get("/api/fighter", async (req, res) => {
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
    return step1(url, req);
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
            await step2(enhancedProfileUrlFoundOnPage, res, req);
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

app.get("/api/all_profiles", (req, res) => {
  let json = fs.readFileSync("FighterProfiles.json");
  return res.send(json);
});

function step1(initalUrlToScrape, req, res) {
  return new Promise((resolve, reject) => {
    request(
      initalUrlToScrape,
      { headers: { "User-Agent": req.headers["user-agent"] } },
      (error, response, html) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          let fighterNameIndex = $(".new_table td a");
          let figherBlocks = [];

          $(fighterNameIndex).each((x) => {
            figherBlocks.push({
              href: fighterNameIndex[x].attribs.href,
              name: fighterNameIndex[x].children[0].data,
            });
          });

          resolve(figherBlocks);
        } else {
          reject(error);
        }
      }
    );
  });
}

function step2(enhancedProfileUrlFoundOnPage, res, req) {
  return new Promise((resolve, reject) => {
    request(
      enhancedProfileUrlFoundOnPage,
      { headers: { "User-Agent": req.headers["user-agent"] } },
      (error1, response1, html1) => {
        if (!error1 && response1.statusCode == 200) {
          const $ = cheerio.load(html1);

          //find element
          const fullName = $(".fighter-title h1 .fn");
          const nickName = $(
            ".fighter-title h1 .nickname, .fighter-title h1 .nickname_empty"
          );
          const birthCountry = $(".fighter-title .birthplace strong");
          const fightingOutOf = $("span.locality");
          const flag = $(".fighter-title .big_flag");
          const wins = $("div.winloses.win span");
          const losses = $("div.winloses.lose span");
          const weightClass = $(
            "body > div.wrapper > div.inner-wrapper > div.col-left > div > section:nth-child(3) > div > div.fighter-info > div.fighter-right > div.fighter-data > div.bio-holder > div > a"
          );
          const fighterImage = $(".fighter-info .profile-image-mobile");

          //scrape the data
          const fullnameValue = $(fullName).text();
          const nickNameValue = $(nickName).text();
          const birthCountryValue = $(birthCountry).text();
          const fightingOutOfValue = $(fightingOutOf).text();
          const flagValue = $(flag).attr("src");
          const winsValue = $(wins).text();
          const lossesValue = $(losses).text();
          const weightClassValue = $(weightClass).text();
          const fighterImageValue = $(fighterImage).attr("src");

          //push data found to global array
          data.push({
            name: fullnameValue,
            nickname: nickNameValue,
            country: birthCountryValue,
            fightingOutOf: fightingOutOfValue,
            flag: "https://www.sherdog.com" + flagValue,
            wins: winsValue.replace("Wins", ""),
            losses: lossesValue.replace("Losses", ""),
            weightClass: weightClassValue,
            image: "https://www.sherdog.com" + fighterImageValue,
          });

          console.log("Profile scraped successfully!");

          let jsonObject = JSON.stringify(data[0]);
          console.log("Checking json object in step 2", jsonObject);

          if (!fs.existsSync("FighterProfiles.json")) {
            jsonObject = JSON.stringify(data);
            fs.writeFileSync("FighterProfiles.json", jsonObject);
          } else {
            //check if same fighter already exists in file
            //[][]
            let check = fs.readFileSync("FighterProfiles.json");
            let checkJson = JSON.parse(check);

            console.log(checkJson.length);
            for (let x = 0; x < checkJson.length; x++) {
              let checkName = checkJson[x].name;
              let checkNickname = checkJson[x].nickname;
              let checkCountry = checkJson[x].country;
              let checkFightingOutOf = checkJson[x].fightingOutOf;
              let checkFlag = checkJson[x].flag;
              let checkWins = checkJson[x].wins;
              let checkLosses = checkJson[x].losses;
              let checkWeightClass = checkJson[x].weightClass;
              let checkFighterImage = checkJson[x].image;

              if (
                checkName == fullnameValue &&
                checkNickname == nickNameValue &&
                checkCountry == birthCountryValue &&
                checkFightingOutOf == fightingOutOfValue &&
                checkFlag == "https://www.sherdog.com" + flagValue &&
                checkWins == winsValue.replace("Wins", "") &&
                checkLosses == lossesValue.replace("Losses", "") &&
                checkWeightClass == weightClassValue &&
                checkFighterImage ==
                  "https://www.sherdog.com" + fighterImageValue
              ) {
                console.log("Fighter already exists in file");
                data = []; //empty the global data array
                return res.send("Fighter already exists in file!");
              }
            }

            checkJson.push(JSON.parse(jsonObject));

            // stringify the updated array
            let updatedData = JSON.stringify(checkJson);
            // write the updated data to the file
            fs.writeFileSync("FighterProfiles.json", updatedData);
            res.send(
              "Scraped data added to json file!\n\n " +
                "Go too /api/allProfiles to see all fighters"
            );
          }
          resolve(data);
        } else {
          reject(error1);
        }
      }
    );
  });
} //end of step2

app.listen(8080, () => {
  console.log("MMA Fighter API started on http://localhost:8080/");
});
