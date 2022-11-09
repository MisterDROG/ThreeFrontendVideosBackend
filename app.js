const express = require("express");
const mongoose = require("mongoose");
const startScrapper = require("./modules/scrapper.js");
const router = require("./routes/getData.js");

const { PORT = 4000 } = process.env;

const channelsUrls = [
  "https://www.youtube.com/c/UlbiTV/videos",
  "https://www.youtube.com/c/SuprunAlexey/videos",
  "https://www.youtube.com/c/SergeyDmitrievskyit/videos",
  "https://www.youtube.com/channel/UCkDC1K5iKz65BdENM4x7l5A/videos",
  "https://www.youtube.com/channel/UCkTwHrk8cvCe80PJ7cgwFIQ/videos",
  "https://www.youtube.com/channel/UCGhWsgwqpA_HH1R9j-B04dw/videos",
  "https://www.youtube.com/c/JavascriptNinja/videos",
  "https://www.youtube.com/c/VladilenMinin/videos",
  "https://www.youtube.com/channel/UCyHa5ihd_ta2esek59C9EMg/videos",
  // 'https://www.youtube.com/c/%D0%A4%D1%80%D0%BE%D0%BD%D1%82%D0%B5%D0%BD%D0%B4/videos',
  // 'https://www.youtube.com/c/FrontendChannel/videos',
  // 'https://www.youtube.com/c/YauhenKavalchuk/videos',
  // 'https://www.youtube.com/c/SergeyNemchinskiy/videos',
  // 'https://www.youtube.com/c/REDGroup/videos',
  // 'https://www.youtube.com/c/Degreet/videos'
];

//connecting to Mongo database
mongoose.connect("mongodb://localhost:27017/tfvdb", {
  useNewUrlParser: true,
});

//starting scrapper to find n best videos from YouTube channels and loading them to Mongo database
startScrapper(channelsUrls);

//express server for frontend requests
const app = express();
app.use("/", router);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
