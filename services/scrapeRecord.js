const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");

let data = [];

module.exports = {
  scrape: function step2(enhancedProfileUrlFoundOnPage, res, req) {
    let updateRecord = false;
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
            const fighterHeight = $(
              "body > div.wrapper > div.inner-wrapper > div.col-left > div > section:nth-child(3) > div > div.fighter-info > div.fighter-right > div.fighter-data > div.bio-holder > table > tbody > tr:nth-child(2) > td:nth-child(2) > b"
            );
            const fighterKoTkoWins = $(
              "body > div.wrapper > div.inner-wrapper > div.col-left > div > section:nth-child(3) > div > div.fighter-info > div.fighter-right > div.fighter-data > div.winsloses-holder > div.wins > div:nth-child(3) > div.pl"
            );
            const figtherSubmissionWins = $(
              "body > div.wrapper > div.inner-wrapper > div.col-left > div > section:nth-child(3) > div > div.fighter-info > div.fighter-right > div.fighter-data > div.winsloses-holder > div.wins > div:nth-child(5) > div.pl"
            );
            const figtherDecisonsWins = $(
              "body > div.wrapper > div.inner-wrapper > div.col-left > div > section:nth-child(3) > div > div.fighter-info > div.fighter-right > div.fighter-data > div.winsloses-holder > div.wins > div:nth-child(7) > div.pl"
            );

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
            const heightValue = $(fighterHeight).text();
            const kotkoWinsValue = $(fighterKoTkoWins).text();
            const figtherSubmissionWinsVaule = $(figtherSubmissionWins).text();
            const figtherDecisonsWinsVaule = $(figtherDecisonsWins).text();

            let opponentDataFiltered = [];

            /////////////////////////////////////////////////////////////////

            // Select the elements that contain the information you need
            const opponentNames = $(".new_table tr td:nth-child(2) a")
              .map((i, el) => $(el).text())
              .get();
            const eventNames = $(".new_table tr td:nth-child(3) a")
              .map((i, el) => $(el).text())
              .get();
            const eventDates = $(".new_table tr td:nth-child(3) span.sub_line")
              .map((i, el) => $(el).text())
              .get();
            const methodOfVictory = $(".new_table tr td.winby b")
              .map((i, el) => $(el).text())
              .get();
            const winLossData = $(".new_table tr td:first-child span")
              .map((i, el) => $(el).text())
              .get();

            const minLength = Math.min(
              opponentNames.length,
              eventNames.length,
              eventDates.length,
              methodOfVictory.length,
              winLossData.length
            );

            for (let i = 0; i < minLength; i++) {
              opponentDataFiltered.push({
                outcome: winLossData[i],
                opponent: opponentNames[i],
                event: eventNames[i],
                date: eventDates[i],
                method: methodOfVictory[i],
              });
            }

            /////////////////////////////////////////////////////////////////

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
              height: heightValue,
              winsBy: [
                {
                  kotko: kotkoWinsValue,
                  submissions: figtherSubmissionWinsVaule,
                  decisions: figtherDecisonsWinsVaule,
                },
              ],
              fights: { opponentDataFiltered },
            });
            //s
            console.log("Profile scraped successfully!");

            let jsonObject = JSON.stringify(data[0]);

            if (!fs.existsSync("FighterProfiles.json")) {
              jsonObject = JSON.stringify(data);
              fs.writeFileSync("FighterProfiles.json", jsonObject);
            } else {
              //check if same fighter already exists in file

              let check = fs.readFileSync("FighterProfiles.json");
              let checkJson = JSON.parse(check);

              //checking for duplicates
              for (let x = 0; x < checkJson.length; x++) {
                if (
                  checkJson[x].name == fullnameValue &&
                  checkJson[x].nickname == nickNameValue &&
                  checkJson[x].country == birthCountryValue &&
                  checkJson[x].fightingOutOf == fightingOutOfValue &&
                  checkJson[x].flag == "https://www.sherdog.com" + flagValue &&
                  checkJson[x].wins == winsValue.replace("Wins", "") &&
                  checkJson[x].losses == lossesValue.replace("Losses", "") &&
                  checkJson[x].weightClass == weightClassValue &&
                  checkJson[x].image ==
                    "https://www.sherdog.com" + fighterImageValue &&
                  checkJson[x].height == heightValue &&
                  checkJson[x].winsBy[0].kotko == kotkoWinsValue &&
                  checkJson[x].winsBy[0].submissions ==
                    figtherSubmissionWinsVaule &&
                  checkJson[x].winsBy[0].decisions ==
                    figtherDecisonsWinsVaule &&
                  checkJson[x].fights == opponentDataFiltered
                ) {
                  console.log("Fighter already exists in file");
                  data = []; //empty the global data array
                  return res.send("Fighter already exists in file!");
                }
                //if record exists but information is missing and needs updating
                else if (
                  checkJson[x].name == fullnameValue &&
                  checkJson[x].nickname == nickNameValue
                ) {
                  checkJson[x].birthCountry = birthCountryValue;
                  checkJson[x].fightingOutOf = fightingOutOfValue;
                  checkJson[x].flag = "https://www.sherdog.com" + flagValue;
                  checkJson[x].wins = winsValue.replace("Wins", "");
                  checkJson[x].losses = lossesValue.replace("Losses", "");
                  checkJson[x].weightClass = weightClassValue;
                  checkJson[x].image =
                    "https://www.sherdog.com" + fighterImageValue;
                  checkJson[x].height = heightValue;
                  checkJson[x].winsBy[0].kotko = kotkoWinsValue;
                  checkJson[x].winsBy[0].submissions =
                    figtherSubmissionWinsVaule;
                  checkJson[x].winsBy[0].decisions = figtherDecisonsWinsVaule;
                  checkJson[x].fights = opponentDataFiltered;
                  updateRecord = true;
                }
              }

              if (updateRecord) {
                let updatedData = JSON.stringify(checkJson);
                fs.writeFileSync("FighterProfiles.json", updatedData);
                return res.send(
                  `Fighter profile updated for: ` + fullnameValue
                );
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
  }, //end of step2
};
