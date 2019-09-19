const Auth0 = require("./auth0");

function acceptedAtConference(conference, talks, speaker) {
  Auth0.conferenceApproved(conference, talks, speaker);
}

function acceptedAtMeetup(meetup, talk, speaker) {
  Auth0.meetupApproved(meetup, talk, speaker);
}

function rejectedFromConference(conference, talks, speaker) {
  console.log(`${speaker.name}'s talk ${talks[0].title} was not accepted at ${conference.name}`);
}

function postConferenceReport(report) {
  Auth0.postConferenceReport(report);
}

module.exports = {
  acceptedAtConference,
  acceptedAtMeetup,
  rejectedFromConference,
  postConferenceReport
};