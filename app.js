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
    listDatabases(client);
  }
});
updateProfilesOnServerStart(client, fighterProfiles);

async function listDatabases(client) {
  try {
    databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
  } catch (e) {
    console.log(e);
  }
}

//create function to update collection with json file on server start
async function updateProfilesOnServerStart(client, fighterProfiles) {
  try {
    const db = client.db("FighterProfiles");
    const collection = db.collection("FighterProfilesCollection");
    const result = await collection.insertMany(JSON.parse(fighterProfiles));
    console.log(result);
  } catch (e) {
    console.log(e);
  }
}
