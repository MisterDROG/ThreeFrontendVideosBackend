const config = require("./projectConfigs/configForProject");
const express = require("express");
const mongoose = require("mongoose");
const startScrapper = require("./modules/scrapper.js");
const router = require("./routes/getData.js");

const { PORT = 4000 } = process.env;

//connecting to Mongo database
mongoose.connect("mongodb://localhost:27017/tfvdb", {
  useNewUrlParser: true,
});

//starting scrapper to find n best videos from YouTube channels and loading them to Mongo database
startScrapper();

//express server for frontend requests
const app = express();
app.use("/", router);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}\n`);
  console.log("Config parametrs: ");
  console.log(
    "Amount of videos to push to DB: ",
    config.scrappingParametrs.amountOfBestVideos
  );
  console.log(
    "Amount of channels to scrap from DB: ",
    config.scrappingParametrs.amountOfScrappingChannels
  );
  console.log(
    "Add new channels: ",
    config.scrappingParametrs.addNewChannelsMode
  );
  console.log(
    "Test Mode: Delete all added channels: ",
    config.testingParametrs.testChannelDb
  );
  console.log(
    "Test Mode: Delete all added videos: ",
    config.testingParametrs.testPostDb
  );
});
