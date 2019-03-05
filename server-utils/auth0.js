const axios = require("axios");
const cloudinary = require("cloudinary");
const puppeteer = require("puppeteer");
const helpers = require("./helpers");

let creds;

if (process.env.NODE_ENV === "prod") {
  creds = process.env;
} else {
  creds = require("../credentials");
}

function encodeData(data) {
  for(let key in data) {
    data[key] = encodeURIComponent(data[key]);
  }
  return data;
}

function buildUrl(url, params) {
  let queryParams = "";
  params = encodeData(params);
  for (let key in params) {
    queryParams += `${key}=${params[key]}&`;
  }
  console.log(`Preparing ${url}?${queryParams}`);
  return `${url}?${queryParams}`;
}

function getLocation(event) {
  if (event.location) return event.location;
  if (event.state) return `${event.city}, ${event.state}, ${event.country}`;
  return `${event.city}, ${event.country}`;
}

function getToFromDates(event) {
  const startDate = helpers.dateFormat(event.startDate);
  if (!event.endDate) return startDate;
  const endDate = helpers.dateFormat(event.endDate);
  if (event.startDate === event.endDate) return startDate;
  return `${startDate} to ${endDate}`;
}

function getTalkTitles(talk) {
  if (talk.title) return talk.title;
  return talk.map(t => t.title).join(", ");
}

function getWebsite(event) {
  if (event.url) return event.url;
  return `https://meetup.com/${event.meetupUrlName}`;
}

function addConferenceToSheet(c, t, s, isMeetup) {
  const url = "https://hooks.zapier.com/hooks/catch/3069472/w12ikq/";
  const data = {
    conference: c.name,
    start: helpers.convertTimestampToMMDYY(c.startDate),
    end: helpers.convertTimestampToMMDYY(c.endDate ? c.endDate : c.startDate),
    twitter: isMeetup ? "" : c.twitter,
    website: getWebsite(c),
    location: getLocation(c),
    talk0: t[0].title,
    talk1: t[1] ? t[1].title : "",
    speaker: s.name
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error adding to sheet", err);
  });
}

function createSLK(c, t, s) {
  let _browser;
  let _page;
  const filename = `${__dirname}/tmp/${(new Date()).getTime()}.png`;

  puppeteer.launch().then(browser => {
    return _browser = browser;
  }).then(browser => {
    return _page = browser.newPage();
  }).then(page => {
    return page.goto(c.url);
  }).then(() => {
    return _page;
  }).then(page => {
    page.setViewport({width: 411, height: 823});
  }).then(() => {
    return _page;
  }).then(page => {
    return page.screenshot({ path: filename });
  }).then(() => {
    return _browser.close();
  }).then(_ => {
    console.log("We got a screenshot");
    //Upload to cloudinary
    cloudinary.config({
      cloud_name: creds.CLOUDINARY_CLOUD_NAME,
      api_key: creds.CLOUDINARY_API_KEY,
      api_secret: creds.CLOUDINARY_API_SECRET
    });

    return (new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload(filename, function (err, result) {
        if (err) return reject(err);
        resolve(result);
      });
    }));
  }).then(result => {
    console.log("Sent to Cloudinary");
    const cloudinaryURL = result.secure_url;

    const url = "https://hooks.zapier.com/hooks/catch/3069472/w14rak/";

    const data = {
      name: c.name,
      overview: c.overview,
      dates: getToFromDates(c),
      twitter: c.twitter,
      attendee_goal: c.attendeeGoal,
      relationships_goal: c.relationshipGoal,
      speaker: s.name,
      talks: t.map(talk => talk.title).join("\n"),
      screenshot: `${cloudinaryURL}`,
      website: c.url,
      location: getLocation(c),
      conference_id: c.id
    };

    let hook = buildUrl(url, data);
    return axios.get(hook).catch(err => {
      console.log("Error creating SLK", err);
    });
  });
}

function sendSlackMessage(c, t, s, isMeetup) {
  const url = "https://hooks.zapier.com/hooks/catch/3069472/kiv6sa/";

  const data = {
    conference: isMeetup ? `Meetup ${c.name}` : c.name,
    speaker: s.name,
    location: getLocation(c),
    dates: getToFromDates(c)
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error sending Slack message", err);
  });
}

function addToEvangelistCalendar(c, t, s) {
  const url = "https://hooks.zapier.com/hooks/catch/3069472/ks3xs7/";

  const data = {
    conference: c.name,
    speaker: s.name,
    talks: getTalkTitles(t),
    start: helpers.convertTimestampToMMDYY(c.startDate),
    end: helpers.convertTimestampToMMDYY(c.endDate ? c.endDate : c.startDate),
    overview: c.overview,
    location: getLocation(c)
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error adding to evangelism calendar", err);
  });
}

function addToTrello(c, t, s) {
  const url = "https://hooks.zapier.com/hooks/catch/3069472/w59cdi/";

  const data = {
    conference: c.name,
    speaker: s.name,
    talks: t.map(talk => talk.title).join(", "),
    start: helpers.convertTimestampToMMDYY(c.startDate),
    overview: c.overview,
    location: getLocation(c),
    website: c.url
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error adding to Trello", err);
  });
}

function addToCommunityForums(c, t, s) {
  const url = "https://hooks.zapier.com/hooks/catch/3069472/cc3e2t/";

  const data = {
    communityUsername: s.communityUsername,
    talks: getTalkTitles(t),
    conference: c.name,
    location: getLocation(c),
    website: getWebsite(c),
    dates: getToFromDates(c)
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error adding to Community Forums", err);
  });
}

function addToMarketingRoadmap(c, t, s, isMeetup) {
  const url = "https://hooks.zapier.com/hooks/catch/3069472/wgx5s3/";

  const data = {
    start: helpers.convertTimestampToMMDYY(c.startDate),
    conference: c.name,
    region: c.regionRoadmapValue,
    website: getWebsite(c),
    speaker: s.name,
    owner: s.email,
    overview: isMeetup ? "" : c.overview,
    topic: isMeetup ? "Meetup" : "Conference"
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error adding to Marketing Roadmap", err);
  });
}

function addMeetupToTrello(m, t, s) {
  const url = "https://hooks.zapier.com/hooks/catch/3069472/wgpoty/";

  const data = {
    conference: `Meetup ${m.name}`,
    location: getLocation(m),
    speaker: s.name,
    talks: t.title,
    website: `https://meetup.com/${m.meetupUrlName}`,
    start: helpers.convertTimestampToMMDYY(m.startDate)
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error adding Meetup to Trello", err);
  });
}

function addToDevelopersReachedSheet(r) {
  let url = "https://hooks.zapier.com/hooks/catch/3069472/xmwrg8/";

  const data = {
    eventName: r.eventName,
    type: r.type,
    source: r.source,
    formattedDate: helpers.convertTimestampToMMDYY(c.eventDate),
    developersReached: r.developersReached,
    region: r.region,
    quarter: helpers.getQuarter(c.eventDate)
  };

  let hook = buildUrl(url, data);
  return axios.get(hook).catch(err => {
    console.log("Error adding to developers reached sheet");
  });
}

function conferenceApproved(conference, talks, speaker) {

  const promiseArray = [
    addConferenceToSheet(conference, talks, speaker),
    createSLK(conference, talks, speaker),
    sendSlackMessage(conference, talks, speaker),
    addToEvangelistCalendar(conference, talks, speaker),
    addToTrello(conference, talks, speaker),
    addToCommunityForums(conference, talks, speaker),
    addToMarketingRoadmap(conference, talks, speaker)
  ];

  return Promise.all(promiseArray).then(_ => {
    console.log("All hooks completed for conference acceptance");
  });
}

function meetupApproved(meetup, talk, speaker) {
  const promiseArray = [
    sendSlackMessage(meetup, talk, speaker, true),
    addConferenceToSheet(meetup, [talk], speaker, true),
    addToEvangelistCalendar(meetup, talk, speaker),
    addMeetupToTrello(meetup, talk, speaker),
    addToCommunityForums(meetup, talk, speaker),
    addToMarketingRoadmap(meetup, talk, speaker, true)
  ];

  return Promise.all(promiseArray).then(_ => {
    console.log("All hooks completed for meetup acceptance");
  })
}

function postConferenceReport(report) {
  const promiseArray = [
    addToDevelopersReachedSheet(report)
  ];

  return Promise.all(promiseArray).then(_ => {
    console.log("All hooks completed for post conference report");
  });
}

module.exports = {
  conferenceApproved,
  meetupApproved,
  postConferenceReport
};
