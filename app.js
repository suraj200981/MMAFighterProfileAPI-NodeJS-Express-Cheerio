const express = require("express");
const app = express();

const fightersRouter = require("./routes/fighterProfiles");
const fighterAnalysis = require("./routes/fighterAnalysis");

const { MongoClient } = require("mongodb");
const fs = require("fs");
require("dotenv").config();

//directs to routes
app.use("/api", fightersRouter);
// app.use("/analysis", fighterAnalysis);

let port = process.env.PORT || 8080; // live and local env port

//read fighter profiles json
const fighterProfiles = fs.readFileSync("FighterProfiles.json");

app.listen(port, function (err) {
  if (err) console.log("Error in server setup");
  console.log("Server listening on Port", port);
});

//connect to mongoDB

const client = new MongoClient(process.env.URI_MONGO);

client.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Connected to MongoDB");
  }
});
