const express = require("express");
const app = express();

const fightersRouter = require("./routes/fighterProfiles");
const fighterAnalysis = require("./routes/fighterAnalysis");

//directs to routes
app.use("/api", fightersRouter);
// app.use("/analysis", fighterAnalysis);

let port = process.env.PORT || 8080; // live env

// let port = 8080; //localhost

app.listen(port, function (err) {
  if (err) console.log("Error in server setup");
  console.log("Server listening on Port", port);
});
