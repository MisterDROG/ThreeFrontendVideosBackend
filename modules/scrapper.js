const puppeteer = require("puppeteer");
const PostsModel = require("../models/post");
const url = require("url");

// function for getting current list of alredy added posts from Mongo database
async function getPostsFromDb() {
  const posts = await PostsModel.find({});
  return posts;
}

// function for deleting all all alredy added posts from Mongo database (uses only when it needs)
async function deletePostsFromDb() {
  await PostsModel.deleteMany({ rate: { $gt: 0 } });
}

//old version of function for finding amount in string type "7,22&nbsp;тыс. просмотров" (in future will be deleted)
// function findAmountInString(stringWithAmount) {
//   const nbsp = String.fromCharCode(160);
//   const splitStr = stringWithAmount.split(nbsp);
//   let amount = 0;

//   if (splitStr[1] && splitStr[1].includes("млн")) {
//     amount = Number(splitStr[0].replace(",", ".")) * 1000000;
//   } else if (splitStr[1] && splitStr[1].includes("тыс")) {
//     amount = Number(splitStr[0].replace(",", ".")) * 1000;
//   } else {
//     amount = Number(splitStr[0].replace(",", ".").split(" ")[0]);
//   }

//   return amount;
// }

function findAmountInString(stringWithAmount) {
  const regExpNumb = /([0-9,]+)|тыс|млн|млрд/g;

  console.log(
    "in string ",
    stringWithAmount,
    "we got numb: ",
    stringWithAmount.match(regExpNumb)
  );

  const splitStr = stringWithAmount.match(regExpNumb);

  let amount = 0;
  if (splitStr[1] && splitStr[1] == "млрд") {
    amount = Number(splitStr[0].replace(",", ".")) * 1000000000;
  } else if (splitStr[1] && splitStr[1] == "млн") {
    amount = Number(splitStr[0].replace(",", ".")) * 1000000;
  } else if (splitStr[1] && splitStr[1] == "тыс") {
    amount = Number(splitStr[0].replace(",", ".")) * 1000;
  } else {
    amount = Number(splitStr[0].replace(",", ".").split(" ")[0]);
  }

  console.log("Got:", amount);

  return amount;
}

// function for scrapping amount of subscriptons for chosen YouTube channel (now not in use)
async function subsCounter(pagePuppeteer) {
  const channelName = await pagePuppeteer.$eval("#text", (el) => el.innerText);
  const subs = await pagePuppeteer.$eval(
    "#subscriber-count",
    (el) => el.innerText
  );

  let subsAmount = findAmountInString(subs);

  console.log("Channel Name: ", channelName);
  console.log("Subs amount: ", subsAmount);

  return subsAmount;
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
    }
  });

  return bestVideoOnChannel;
}

// function for scrapping and finding best video from one channel
async function videoCounter(pagePuppeteer, channelUrl, postsInDb) {
  await pagePuppeteer.goto(channelUrl);

  //waiting for page load to needed selector (1s works ok, if not - increase, until scrapper stops adding to database empty objects)
  await pagePuppeteer.waitForTimeout(1000);

  //finding all opened cards with videos
  const allCards = await pagePuppeteer.$$("#dismissible");
  console.log("Amount of videos: ", allCards.length);

  // collecting array with video posts objects
  let findedPosts = [];
  for (let i = 0; i < 10 && i < allCards.length; i++) {
    let videoName = await allCards[i].$eval(
      "#video-title",
      (el) => el.innerText
    );
    let videoViews = await allCards[i].$eval(
      `#metadata-line > span:nth-child(2)`,
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
    });
  }

  setRate(findedPosts);
  return (bestVideoOnChannel = findBestVideoOnChannel(findedPosts, postsInDb));
}

// function for scrapping n best videos from several channels
async function severalSitesScrapper(pagePuppeteer, channelUrls, postsInDb) {
  let allbestVideos = [];
  for (const channelUrl of channelUrls) {
    console.log("Current scrapping channel: ", channelUrl);
    try {
      let video = await videoCounter(pagePuppeteer, channelUrl, postsInDb);
      allbestVideos.push(video);
      console.log("DONE: ", channelUrl);
    } catch (err) {
      console.log(channelUrl, "- failed. Error: ", err);
    }
  }

  const removed = allbestVideos
    .sort((a, b) => (a.rate < b.rate ? 1 : -1))
    .splice(3);
  return allbestVideos;
}

// function for pushing sorted best videos into databse
async function pushToDb(videos) {
  for (const video of videos) {
    console.log(video);
    try {
      await PostsModel.create({
        title: video.title,
        viewsAmpount: video.viewsAmpount,
        youTubeLink: video.youTubeLink,
        embedLink: video.embedLink,
        rate: video.rate,
        date: video.date,
      });
      console.log("Video ", video.title, " - added to DB");
    } catch (err) {
      console.log("Data is not loaded to Db. Error: ", err);
    }
  }
}

//main function of the module for scrapping (with puppeteer lib)
async function startScrapper(channelUrls) {
  const postsInDb = await getPostsFromDb();
  const browser = await puppeteer.launch();
  const pagePuppeteer = await browser.newPage();

  const videosBestFromFound = await severalSitesScrapper(
    pagePuppeteer,
    channelUrls,
    postsInDb
  );

  await pushToDb(videosBestFromFound);

  await browser.close();

  deletePostsFromDb();
}

module.exports = startScrapper;
