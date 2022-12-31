const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

const app = express();

let data = [];

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
    let firstName = "khabib"
    let lastName = "nurmagomedov"

    let urlToScrape = 'https://www.sherdog.com/stats/fightfinder?SearchTxt='+firstName+'+'+lastName+'&weight=&association=';
    request(urlToScrape, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);

            const fighterNameFound = $('.new_table td a');

            //push data found to global array

            const firstNameFoundOnPage = $(fighterNameFound).text();
            const enhancedProfileUrlFoundOnPage = $(fighterNameFound).attr('href')
            data.push({
                fighterName: firstNameFoundOnPage,
                profileUrl: enhancedProfileUrlFoundOnPage
            })
        }
        res.send(data);
    });
});




app.listen(8080, () => {
    console.log("MMA Fighter API started on http://localhost:8080/");
});