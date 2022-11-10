const mongoose = require("mongoose");

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
