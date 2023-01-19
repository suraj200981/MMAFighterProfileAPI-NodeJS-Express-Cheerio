const express = require("express");
const app = express();

const fightersRouter = require("./routes/fighterProfiles");
const fighterAnalysis = require("./routes/fighterAnalysis");

//directs to routes
app.use("/api", fightersRouter);
// app.use("/analysis", fighterAnalysis);

let port = process.env.PORT || 80;

app.listen(port);
