const express = require("express");
const request = require("request");
const cheerio = require("cheerio");
const randomUseragent = require("random-useragent");
const axios = require("axios");
const https = require("https");

const app = express();

let data = [];
let enhancedProfileUrlFoundOnPage = "";

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

let globalResponse;
//this endpoint will scrape fighter profiles
app.get("/api/fighter", (req, res) => {
  let userAgent = "";
  userAgent = randomUseragent.getRandom();
  //set req headers to random user agent
  req.headers["user-agent"] = userAgent;

  //for now i will hard code what the req query params would be
  let firstName = "jon";
  let lastName = "jones";
  //step 1 search for fighter to retreive fighter profile url
  let initalUrlToScrape =
    "https://www.sherdog.com/stats/fightfinder?SearchTxt=" +
    firstName +
    "+" +
    lastName +
    "&weight=&association=";
  //add more headers to the request
  let arr = [];
  step1(initalUrlToScrape, req, res)
    .then((figherBlocks) => {
      //for loop to loop through each fighter block
      for (let i = 0; i < figherBlocks[0].length; i++) {
        console.log(figherBlocks[0][i].children[0].data.toLowerCase());
        //log the href
        console.log(figherBlocks[0][i].attribs.href);
      }
    })
    .catch((error) => {
      // Handle any errors here
    });
});

app.listen(8080, () => {
  console.log("MMA Fighter API started on http://localhost:8080/");
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
            // console.log(fighterNameIndex[x].children[0].data.toLowerCase());
            // fighterBlocks.push(fighterNameIndex[x]);
            figherBlocks.push(fighterNameIndex);
          });

          resolve(figherBlocks);
        } else {
          reject(error);
        }
      }
    );
  });
}

function getFighterBlocks(html) {
  const $ = cheerio.load(html);
  let figherBlocks = [];
  let fighterNameIndex = $(".new_table td a");
  let fighterNameFound = $(
    "html.light .new_table tr:nth-child(even):not(.table_head)"
  );

  $(fighterNameFound).each((x) => {
    // console.log(fighterNameIndex[x].children[0].data.toLowerCase());
    figherBlocks.push(fighterNameIndex);
  });
  return figherBlocks;
}

function getFighterNameIndex(html) {
  const $ = cheerio.load(html);
  let fighterNameIndex = $(".new_table td a");
  return fighterNameIndex;
}
