const config = require("../projectConfigs/configForProject");
const ChannelsModel = require("../models/channel.js");
const findAmountInString = require("../utils/amountFinder");
const readline = require("readline");

//function for getting new channels from the console (using recursion)
async function inputChannelUrlFromConsole() {
  const finishOfAdding = false;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let answer = await new Promise((resolve, reject) => {
    const signal = AbortSignal.timeout(
      config.scrappingParametrs.intervalForAddChannelSkip
    );

    function abortInput() {
      console.log("\n!Channel add question timed out!");
      resolve("n");
    }

    signal.addEventListener("abort", abortInput, { once: true });

    rl.question(
      `Do you want to add new channel? (${
        config.scrappingParametrs.intervalForAddChannelSkip / 1000
      } sec to answer) [y/n]: `,
      { signal },
      (answer) => {
        signal.removeEventListener("abort", abortInput, { once: true });
        resolve(answer);
      }
    );
  });

  if (answer == "y") {
    let url = await new Promise((resolve, reject) => {
      const signal = AbortSignal.timeout(
        config.scrappingParametrs.intervalForAddChannelSkip
      );

      function abortInput() {
        console.log("\n!URL add question timed out!");
        resolve(null);
      }

      signal.addEventListener("abort", abortInput, { once: true });

      rl.question(
        `Enter channel url (${
          config.scrappingParametrs.intervalForAddChannelSkip / 1000
        } sec to answer): `,
        { signal },
        (url) => {
          signal.removeEventListener("abort", abortInput, { once: true });
          rl.close();
          resolve(url);
        }
      );
    });
    return [url, ...(await inputChannelUrlFromConsole())];
  } else {
    rl.close();
    return [];
  }
}

// function for scrapping amount of subscriptons for chosen YouTube channel (now not in use)
async function scrapChannelData(pagePuppeteer, channelUrl) {
  await pagePuppeteer.goto(channelUrl);

  //waiting for page load to needed selector (1s works ok, if not - increase, until scrapper stops adding to database empty objects)
  await pagePuppeteer.waitForTimeout(
    config.scrappingParametrs.delayForPageLoading
  );

  //finding all name and amount of subscribers of the channel
  const channelName = await pagePuppeteer.$eval("#text", (el) => el.innerText);
  const subs = await pagePuppeteer.$eval(
    "#subscriber-count",
    (el) => el.innerText
  );

  let subsAmount = findAmountInString(subs);

  const channelObj = {
    name: channelName,
    link: channelUrl,
    subscribers: subsAmount,
  };

  console.log("Channel: ", channelObj);

  return channelObj;
}

//function for creating channel in database
async function putChanneltoDb(channelObj) {
  try {
    await ChannelsModel.create({
      name: channelObj.name,
      link: channelObj.link,
      subscribers: channelObj.subscribers,
    });
    console.log("Channel ", channelObj.name, " - added to DB");
  } catch (err) {
    console.log("Channel is not loaded to Db. Error: ", err);
  }
}

//function for deleting channel in database
async function deleteChannelFromDb() {
  await ChannelsModel.deleteMany({});
  console.log("TEST MODE: new channels deleted");
}

//main function of the module for scrapping and adding a channel to the database
async function addNewChannel(pagePuppeteer) {
  const channelUrls = await inputChannelUrlFromConsole();

  if (!(channelUrls.length == 0)) {
    console.log("channelUrls", channelUrls);
    for (const url of channelUrls) {
      if (!(url == null)) {
        try {
          const channelObj = await scrapChannelData(pagePuppeteer, url);
          await putChanneltoDb(channelObj);
        } catch (err) {
          console.log("Error in channel scrapping: ", err);
        }
      }
    }
  } else {
    console.log("No channels to add");
  }
  // optional deleting of all added channels for testmode
  if (config.testingParametrs.testChannelDb == true) {
    await deleteChannelFromDb();
  }
}

module.exports = addNewChannel;
