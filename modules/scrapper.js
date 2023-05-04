const config = require("../projectConfigs/configForProject");
const puppeteer = require("puppeteer");
const PostsModel = require("../models/post");
const ChannelsModel = require("../models/channel.js");
const addNewChannel = require("./channelToDb");
const findAmountInString = require("../utils/amountFinder");
const url = require("url");

// function for getting current list of already added posts from Mongo database
async function getPostsFromDb() {
  const posts = await PostsModel.find({}).populate("channel");
  return posts;
}

// function for deleting all alredy added posts from Mongo database (uses only when it needs)
async function deletePostsFromDb() {
  await PostsModel.deleteMany({ rate: { $gt: 0 } });
  console.log("TEST MODE: new posts deleted");
}

// function for getting n random channels for scrapping from channel database
async function getChannelsFromDb() {
  const allChannels = await ChannelsModel.find({});
  let selectedChannels = [];
  for (
    let i = 0;
    i < config.scrappingParametrs.amountOfScrappingChannels;
    i++
  ) {
    const randomChannel = allChannels.splice(
      Math.floor(Math.random() * allChannels.length),
      1
    )[0];
    selectedChannels.push(randomChannel);
  }
  return selectedChannels;
}

// function for setting rate (type: amountOfViews/averageAmountOfViewsInArray) to all videos in the array
function setRate(arrayWithPosts) {
  let sumViews = 0;
  arrayWithPosts.forEach((post) => {
    sumViews += post.viewsAmpount;
  });
  const middleViews = sumViews / arrayWithPosts.length;

  arrayWithPosts.forEach((post) => {
    post.rate = post.viewsAmpount / middleViews;
  });
}

//function for finding best video on channel by rate and checking its existing in database
function findBestVideoOnChannel(arrayWithPosts, postsInDb) {
  let bestVideoOnChannel = {
    title: "",
    viewsAmpount: "",
    youTubeLink: "",
    embedLink: "",
    rate: 0,
    channel: "",
    date: new Date().toLocaleDateString(),
  };

  arrayWithPosts.forEach((post) => {
    if (
      bestVideoOnChannel.rate < post.rate &&
      !postsInDb.find((elem) => elem.youTubeLink === post.youTubeLink)
    ) {
      bestVideoOnChannel.title = post.title;
      bestVideoOnChannel.viewsAmpount = post.viewsAmpount;
      bestVideoOnChannel.youTubeLink = post.youTubeLink;
      bestVideoOnChannel.embedLink =
        "https://www.youtube.com/embed/" +
        url.parse(post.youTubeLink, true).query.v;
      bestVideoOnChannel.rate = post.rate;
      bestVideoOnChannel.channel = post.channel;
    }
  });

  return bestVideoOnChannel;
}

// function for scrapping and finding best video from one channel
async function videoCounter(
  pagePuppeteer,
  channelUrl,
  channelUrlID,
  postsInDb
) {
  await pagePuppeteer.goto(channelUrl);

  //waiting for page load to needed selector (1s works ok, if not - increase, until scrapper stops adding to database empty objects)
  await pagePuppeteer.waitForTimeout(
    config.scrappingParametrs.delayForPageLoading
  );

  //finding all opened cards with videos
  const allCards = await pagePuppeteer.$$("#dismissible");
  console.log("Amount of videos: ", allCards.length);

  // collecting array with video objects from n posts on the page with random start
  let findedPosts = [];
  let postsStart = 0;
  if (
    allCards.length < config.scrappingParametrs.amountOfVideosToScrapOnChannel
  ) {
    postsStart = 0;
    console.log("Videos from: ", postsStart, "to: ", allCards.length);
  } else {
    postsStart = Math.floor(
      Math.random() *
        (allCards.length -
          config.scrappingParametrs.amountOfVideosToScrapOnChannel)
    );
    console.log(
      "Videos from: ",
      postsStart,
      "to: ",
      postsStart + config.scrappingParametrs.amountOfVideosToScrapOnChannel
    );
  }

  for (
    let i = postsStart;
    i < postsStart + config.scrappingParametrs.amountOfVideosToScrapOnChannel &&
    i < allCards.length;
    i++
  ) {
    let videoName = await allCards[i].$eval(
      "#video-title",
      (el) => el.innerText
    );
    let videoViews = await allCards[i].$eval(
      `#metadata-line > span:nth-child(3)`,
      (el) => el.innerText
    );
    let videolink = await allCards[i].$eval(
      "#video-title-link",
      (el) => el.href
    );

    let viewsAmpount = findAmountInString(videoViews);

    findedPosts.push({
      title: videoName,
      viewsAmpount: viewsAmpount,
      youTubeLink: videolink,
      channel: channelUrlID,
    });
  }

  setRate(findedPosts);
  return (bestVideoOnChannel = findBestVideoOnChannel(findedPosts, postsInDb));
}

// function for scrapping n best videos from several channels
async function severalSitesScrapper(pagePuppeteer, channelUrls, postsInDb) {
  let allbestVideos = [];
  for (const channelUrl of channelUrls) {
    console.log("\nCurrent scrapping channel: ", channelUrl.name);
    console.log("Subscribers:", Number(channelUrl.subscribers));
    try {
      let video = await videoCounter(
        pagePuppeteer,
        channelUrl.link,
        channelUrl._id,
        postsInDb
      );
      allbestVideos.push(video);
      console.log("DONE: ", channelUrl.name);
    } catch (err) {
      console.log(channelUrl.name, "- failed. Error: ", err);
    }
  }

  const removed = allbestVideos
    .sort((a, b) => (a.rate < b.rate ? 1 : -1))
    .splice(config.scrappingParametrs.amountOfBestVideos);
  return allbestVideos;
}

// function for pushing sorted best videos into databse
async function pushVideosToDb(videos) {
  console.log("\nBest videos to be pushed to database: ");
  for (const video of videos) {
    console.log("\n", video);
    try {
      await PostsModel.create({
        title: video.title,
        viewsAmpount: video.viewsAmpount,
        youTubeLink: video.youTubeLink,
        embedLink: video.embedLink,
        rate: video.rate,
        date: video.date,
        channel: video.channel,
      });
      console.log("Video ", video.title, " - added to DB");
    } catch (err) {
      console.log("Data is not loaded to Db. Error: ", err);
    }
  }
}

//main function of the module for scrapping (with puppeteer lib)
async function startScrapper() {
  const postsInDb = await getPostsFromDb();
  const browser = await puppeteer.launch();
  const pagePuppeteer = await browser.newPage();

  //asks admin if he want to add new channels for scrapping to database
  if (config.scrappingParametrs.addNewChannelsMode == true) {
    await addNewChannel(pagePuppeteer);
  }

  //scrapping automatically selected channels
  const channelUrls = await getChannelsFromDb();
  console.log("\nChannels to be scrapped: ", channelUrls);
  console.log("\nStart scrapping...");
  const videosBestFromFound = await severalSitesScrapper(
    pagePuppeteer,
    channelUrls,
    postsInDb
  );
  await pushVideosToDb(videosBestFromFound);

  await browser.close();

  //optional deleting of all added videos for testmode
  if (config.testingParametrs.testPostDb == true) {
    await deletePostsFromDb();
  }
}

module.exports = startScrapper;
