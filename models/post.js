const mongoose = require("mongoose");

//database schema for posts in MongoDB (using mongoose)
const postsSchema = new mongoose.Schema({
  date: {
    type: String,
  },
  title: {
    type: String,
  },
  embedLink: {
    type: String,
  },
  youTubeLink: {
    type: String,
  },
  viewsAmpount: {
    type: Number,
  },
  rate: {
    type: Number,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "channel",
  },
});

module.exports = mongoose.model("post", postsSchema);
