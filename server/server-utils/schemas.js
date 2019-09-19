const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;
const CONF_STATUS = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NULL: "NULL"
};
const MEETUP_STATUS = {
  APPLIED: "APPLIED",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  DROPPED: "DROPPED"
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
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: {
        type: String,
        possibleValues: CONF_STATUS
      }
    }
  ],
  overview: String,
  relationshipGoal: Number,
  attendeeGoal: Number,
  slkLink: String,
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

const meetupSchema = mongoose.Schema({
  meetupUrlName: String,
  suggestedDateStart: Date,
  suggestedDateEnd: Date,
  name: String,
  location: String,
  status: {
    type: String,
    possibleValues: MEETUP_STATUS
  },
  startDate: Date,
  attendeeGoal: Number,
  talkId: { type: mongoose.Schema.Types.ObjectId, ref: "Talk" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

Models = {
  Conference: mongoose.model("Conference", conferenceSchema),
  Talk: mongoose.model("Talk", talkSchema),
  User: mongoose.model("User", userSchema),
  Submission: mongoose.model("Submission", submissionSchema),
  Meetup: mongoose.model("Meetup", meetupSchema),
  const: {
    CONF_STATUS,
    MEETUP_STATUS
  }
};

module.exports = Models;