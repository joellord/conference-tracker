// const Auth0 = require("./auth0");

function acceptedAtConference(conference, talks, speaker) {
  // Auth0.conferenceApproved(conference, talks, speaker);
  console.info("Talk accepted at conference, do something");
}

function acceptedAtMeetup(meetup, talk, speaker) {
  // Auth0.meetupApproved(meetup, talk, speaker);
  console.info("Talk accepted at meetup, do something");
}

function rejectedFromConference(conference, talks, speaker) {
  console.log(`${speaker.name}'s talk ${talks[0].title} was not accepted at ${conference.name}`);
}

function postConferenceReport(report) {
  // Auth0.postConferenceReport(report);
  console.info("Post conference report submitted");
}

module.exports = {
  acceptedAtConference,
  acceptedAtMeetup,
  rejectedFromConference,
  postConferenceReport
};