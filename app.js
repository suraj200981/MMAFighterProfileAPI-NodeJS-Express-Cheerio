const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

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

//this endpoint will scrape fighter profiles
app.get('/api/fighter', (req,res) => {

    //for now i will hard code what the req query params would be
    let firstName = "conor"
    let lastName = "mcgregor"

    let initalUrlToScrape = 'https://www.sherdog.com/stats/fightfinder?SearchTxt='+firstName+'+'+lastName+'&weight=&association=';
    request(initalUrlToScrape, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);


            const fighterNameFound = $('.new_table td a');
             enhancedProfileUrlFoundOnPage = $(fighterNameFound).attr('href')



            //step 2
             let profileUrlToScrape = 'https://www.sherdog.com'+enhancedProfileUrlFoundOnPage
            console.log(profileUrlToScrape)
             request(profileUrlToScrape, (error1, response1, html2) => {
                console.log(response1.statusCode)
                if (!error1 && response.statusCode == 200) {
                    const $ = cheerio.load(html2);
        
                    const fullName = $('.fighter-title h1 .fn');
                    const nickName = $('.fighter-title h1 .nickname, .fighter-title h1 .nickname_empty');
            
                    const fullname1 = $(fullName).text();
                    const nickName1 = $(nickName).text();

                    console.log(nickName1);
                    
                  //push data found to global array
                  data.push({
                    name: fullname1,
                    nickname: nickName1
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