const express = require("express");
const app = express();

const fightersRouter = require("./routes/fighterProfiles");
const fighterAnalysis = require("./routes/fighterAnalysis");

//directs to routes
app.use("/api", fightersRouter);
app.use("/analysis", fighterAnalysis);

app.listen(8080, () => {
  console.log("MMA Fighter API started on http://localhost:8080/");
});
