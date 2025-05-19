require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());

app.use(cors());

const searchRoute = require("./routes/search");
app.use("/search", searchRoute);

const infoRoute = require("./routes/info");
app.use("/info", infoRoute);

const answerRoute = require("./routes/answer");
app.use("/answer", answerRoute);

// サーバー起動
app.listen(4000, () => {
  console.log("サーバーが http://localhost:4000 で起動しました");
});
