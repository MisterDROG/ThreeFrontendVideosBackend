const config = {
  scrappingParametrs: {
    amountOfScrappingChannels: 5,
    amountOfBestVideos: 3,
    amountOfVideosToScrapOnChannel: 10,
    delayForPageLoading: 1000,
    addNewChannelsMode: true,
    intervalForScrapping: 120000,
    intervalForAddChannelSkip: 20000,
  },
  testingParametrs: {
    testChannelDb: false,
    testPostDb: false,
  },
};

module.exports = config;
