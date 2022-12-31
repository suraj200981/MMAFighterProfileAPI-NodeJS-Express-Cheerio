const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

const app = express();

let data = [];
let enhancedProfileUrlFoundOnPage ="";

//home endpoint
app.get('/api', (req, res) =>{
    let html = `<h1>Welcome to MMA fighter API by Suraj Sharma</h1>
    <br><br>
    <br>
    <ul style="display:inline;">
    <li style="display:inline;"><a href="http://localhost:8080/api">Home</a></li>
    <li style="display:inline;"><a href="http://localhost:8080/api/fighter">Fighter profile</a></li>
    </ul>`
    

    res.send(html);
})

let globalResponse;
//this endpoint will scrape fighter profiles
app.get('/api/fighter', (req,res) => {

let userAgent = "";
userAgent = randomUseragent.getRandom();
//set req headers to random user agent
req.headers['user-agent'] = userAgent;

    //for now i will hard code what the req query params would be
    let firstName = "jon"
    let lastName = "jones"
    //step 1 search for fighter to retreive fighter profile url
    let initalUrlToScrape = 'https://www.sherdog.com/stats/fightfinder?SearchTxt='+firstName+'+'+lastName+'&weight=&association=';
    //add more headers to the request
    request(initalUrlToScrape,{headers:{ 'User-Agent': req.headers['user-agent']}},(error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            
            const fighterNameFound = $('.new_table td a');
             enhancedProfileUrlFoundOnPage = $(fighterNameFound).attr('href')

            //step 2 navigate to fighter profile url and scrape everything
            let profileUrlToScrape = 'https://www.sherdog.com'+enhancedProfileUrlFoundOnPage
             request(profileUrlToScrape, {headers:{ 'User-Agent': req.headers['user-agent']}},(error1, response1, html2) => {

                if (!error1 && response.statusCode == 200) {
                    const $ = cheerio.load(html2);
                    
                    //find element
                    const fullName = $('.fighter-title h1 .fn');
                    const nickName = $('.fighter-title h1 .nickname, .fighter-title h1 .nickname_empty');
                    const birthCountry = $('.fighter-title .birthplace strong');
                    const fightingOutOf = $('span.locality');
                    const flag = $('.fighter-title .big_flag');
                    const wins = $('div.winloses.win span');
                    const losses = $('div.winloses.lose span');
                    const weightClass = $('body > div.wrapper > div.inner-wrapper > div.col-left > div > section:nth-child(3) > div > div.fighter-info > div.fighter-right > div.fighter-data > div.bio-holder > div > a');

                    
                    //scrape the data
                    const fullnameValue = $(fullName).text();
                    const nickNameValue = $(nickName).text();
                    const birthCountryValue = $(birthCountry).text();
                    const fightingOutOfValue = $(fightingOutOf).text();
                    const flagValue = $(flag).attr('src');
                    const winsValue = $(wins).text();
                    const lossesValue = $(losses).text();
                    const weightClassValue = $(weightClass).text();
                    
           

                  //push data found to global array
                  data.push({
                    name: fullnameValue,
                    nickname: nickNameValue,
                    country: birthCountryValue,
                    fightingOutOf: fightingOutOfValue,
                    flag: "https://www.sherdog.com"+flagValue,
                    wins: winsValue.replace("Wins",""),
                    losses: lossesValue.replace("Losses",""),
                    weightClass: weightClassValue

                    

                  })
                  res.send(data);
                }
                });
        }
        });   

});



app.listen(8080, () => {
    console.log("MMA Fighter API started on http://localhost:8080/");
});