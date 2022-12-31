const express = require('express');
// const request = require('request');
// const cheerio = require('cheerio');

const app = express();

let data = [];

app.get('/api/fighter', (req,res) => {
    res.send("here is where fighter profile data will be scraped");
});

app.listen(8080, () => {
    console.log("MMA Fighter API started on http://localhost:8080/");
});