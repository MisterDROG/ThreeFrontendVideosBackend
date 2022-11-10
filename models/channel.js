const mongoose = require("mongoose");

//database schema for channels in MongoDB (using mongoose)
const channelSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  link: {
    type: String,
    unique: true,
  },
  subscribers: {
    type: String,
  },
});

module.exports = mongoose.model("channel", channelSchema);
