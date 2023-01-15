const express = require("express");
const app = express();

const fightersRouter = require("./routes/fighterProfiles");

app.use("/api", fightersRouter);

app.listen(8080, () => {
  console.log("MMA Fighter API started on http://localhost:8080/");
});
