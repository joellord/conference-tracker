const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;
const CONF_STATUS = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NULL: "NULL"
};

const conferenceSchema = mongoose.Schema({
  name: String,
  startDate: Date,
  endDate: Date,
  city: String,
  state: String,
  country: String,
  url: String,
  cfpUrl: String,
  cfpDate: Date,
  twitter: String,
  submissions: [
    {
      talkId: String,
      userId: String,
      status: {
        type: String,
        possibleValues: [CONF_STATUS.APPROVED, CONF_STATUS.REJECTED, CONF_STATUS.NULL]
      }
    }
  ],
  last_modified: {
    type: Date,
    default: Date.now
  }
});

const talkSchema = mongoose.Schema({
  title: String,
  userId: {type: ObjectId, ref: "User"},
  abstract: String,
  notes: String,
  last_modified: {
    type: Date,
    default: Date.now
  }
});

const userSchema = mongoose.Schema({
  auth0Id: String,
  name: String,
  picture: String,
  bio: String
});

const submissionSchema = mongoose.Schema({
  talkId: ObjectId,
  userId: ObjectId,
  conferenceId: ObjectId
});

Models = {
  Conference: mongoose.model("Conference", conferenceSchema),
  Talk: mongoose.model("Talk", talkSchema),
  User: mongoose.model("User", userSchema),
  Submission: mongoose.model("Submission", submissionSchema),
  const: {
    CONF_STATUS
  }
};

module.exports = Models;