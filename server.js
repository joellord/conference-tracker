const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwtDecode = require("jwt-decode");
const mongoose = require("mongoose");
const axios = require("axios");

const models = require("./server-utils/schemas");
const zapier = require("./server-utils/zapier");
const helpers = require("./server-utils/helpers");

let creds;

if (process.env.NODE_ENV === "prod") {
  creds = process.env;
} else {
  creds = require("./credentials");
}

const CONNECTION_STRING = creds.DB_CONN_STRING;
const PORT = process.env.PORT || 3333;

mongoose.connect(CONNECTION_STRING);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

const authCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${creds.DOMAIN}/.well-known/jwks.json`
  }),
  audience: creds.AUDIENCE,
  issuer: `https://${creds.DOMAIN}/`,
  algorithms: ["RS256"]
});

const getUserId = (headers) => {
  if (!headers.Authorization && !headers.authorization) return null;
  const token = (headers.Authorization || headers.authorization).split(" ")[1];
  const decoded = jwtDecode(token);
  if (!decoded.sub) return null;

  return decoded.sub;
};

const getMongoUserId = (headers) => {
  const userId = getUserId(headers);
  return models.User.findOne({auth0Id: userId}).then(user => user._id).catch(() => undefined);
};

const extractQueryParams = (url) => {
  const queryString = url.split("?")[1];
  const items = queryString.split("&");
  let params = {};
  for (let i = 0; i < items.length; i++) {
    let splittedItems = items[i].split("=");
    params[splittedItems[0]] = decodeURIComponent(splittedItems[1]);
  }
  return params;
};

app.use(express.static("dist"));

app.get("/api/public", (req, res) => {
  res.json({value: "Hello"});
});

app.get("/api/conferences", authCheck, (req, res) => {
  let userId;
  getMongoUserId(req.headers).then(id => {
    userId = id;
    return models.Conference.find({"startDate": { "$gte": new Date() }});
  }).then(conferences => {
    let confs = conferences.map(conference => {
      let conf = Object.assign({}, conference.toObject());
      conf.myApproved = conference.submissions.filter(s => s.status === models.const.CONF_STATUS.APPROVED && s.userId.toString() == userId).length;
      conf.myRejected = conference.submissions.filter(s => s.status === models.const.CONF_STATUS.REJECTED && s.userId.toString() == userId).length;
      conf.mySubmissions = conference.submissions.filter(s => s.status === models.const.CONF_STATUS.NULL && s.userId.toString() == userId).length;
      conf.expired = conf.mySubmissions === 0 && conference.cfpDate < (new Date()).getTime();
      return conf;
    });
    return confs;
  }).then(conferences => {

    conferences = conferences.sort((a, b) => {
      if (a.startDate < b.startDate) return -1;
      return 1;
    });

    res.json(conferences)
  });
});

app.get("/api/upcoming", (req, res) => {
  let users = [];
  let formatted = [];

  models.Conference.find({
      "endDate": { "$gte": new Date() },
      "submissions.status": models.const.CONF_STATUS.APPROVED
    })
  .populate("submissions.userId")
  .then(upcoming => {
    formatted = upcoming.map(u => {
      let submissions = u.submissions.filter(s => s.status === models.const.CONF_STATUS.APPROVED);
      u.submissions = submissions;
      let speakers = [];
      submissions.map(s => {
        if (speakers.indexOf(s.userId.name) === -1) speakers.push(s.userId.name);
      });
      let conference = Object.assign({}, u.toObject());
      conference.speakers = speakers.join(" ");
      conference.type = "CONFERENCE";
      return conference;
    });

    return models.Meetup.find({
      "startDate": { "$gte": new Date() },
      "status": models.const.MEETUP_STATUS.CONFIRMED
    }).populate("userId");
  }).then(meetups => {
    meetups.map(m => {
      let meetup = Object.assign({}, m.toObject());
      meetup.speakers = m.userId.name;
      meetup.url = `https://www.meetup.com/${m.meetupUrlName}`;
      meetup.type = "MEETUP";
      formatted.push(meetup);
    });

    formatted = formatted.sort((a, b) => {
      let dateA = (new Date(a.startDate)).getTime();
      let dateB = (new Date(b.startDate)).getTime();
      return dateA > dateB ? 1 : -1;
    });

    res.json(formatted);
  });
});

app.get("/api/conference/slk", (req, res) => {
  const params = extractQueryParams(req.url);
  const conferenceId = params.conference_id;
  const slkLink = params.slk_link;

  models.Conference.findOneAndUpdate({_id: conferenceId}, {slkLink}).then(conference => {
    res.json(conference);
  });
});

app.get("/api/conference/:id", authCheck, (req, res) => {
  let talkIds = [];
  let talks = {};
  let userIds = [];
  let users = {};
  let conference = {};

  models.Conference.findOne({_id: req.params.id}).then(conf => {
    conference = conf;
    conf.submissions.map((s) => {
      if (talkIds.indexOf(s.talkId) === -1) talkIds.push(s.talkId);
      if (userIds.indexOf(s.userId.toString()) === -1) userIds.push(s.userId);
    });
    return models.User.find({"_id": {$in: userIds}});
  }).then(data => {
    data.map((user) => users[user._id] = user);
    return models.Talk.find({_id: {$in: talkIds}})
  }).then(data => {
    data.map((talk) => talks[talk._id] = talk);
    return conference;
  }).then(conf => {
    let populatedConference = Object.assign({}, conf._doc);
    populatedConference.submissions = conference.submissions.map((s) => {
      return Object.assign({}, s._doc,  {
        user: users[s.userId],
        talk: talks[s.talkId]
      });
    });
    res.json(populatedConference)
  });
});

app.get("/api/conference/:id/submissions", authCheck, (req, res) => {
  let userId;
  getMongoUserId(req.headers).then(id => {
    userId = id;
    return models.Conference.findOne({_id: req.params.id});
  }).then(conference => {
    return conference.submissions.filter(c => c.userId.toString() == userId);
  }).then(submissions => {
    let talkIds = submissions.map(s => s.talkId);
    return models.Talk.find({_id: {$in: talkIds}});
  }).then(talks => {
    res.json(talks);
  });
});

app.post("/api/conference/:id/approvals", authCheck, (req, res) => {
  const approvedSubmissions = req.body;
  let userId;
  let conf;

  console.log("Accepted at conference, starting Zapier sequence");

  // Zapier stuff
  let zapierParams = {};

  getMongoUserId(req.headers).then(id => {
    userId = id;
    return models.Conference.findOne({_id: req.params.id});
  }).then(conference => {
    conference.submissions.map(c => {
      if (c.userId.toString() == userId) {
        if (approvedSubmissions.indexOf(c.talkId) > -1) {
          c.status = models.const.CONF_STATUS.APPROVED;
        } else {
          c.status = models.const.CONF_STATUS.REJECTED;
        }
      }
    });
    return conference.save();
  }).catch(() => console.log("Error saving approvals")).then(conference => {
    conf = conference;
    zapierParams.conferenceId = conference._id;
    zapierParams.conference = conference.name;
    zapierParams.start = helpers.dateFormat(conference.startDate);
    zapierParams.end = helpers.dateFormat(conference.endDate);
    zapierParams.dates = conference.endDate ? `${zapierParams.start} to ${zapierParams.end}` : zapierParams.start;
    zapierParams.twitter = conference.twitter;
    zapierParams.website = conference.url.match(/\#/) ? conference.url.substr(0, conference.url.indexOf("#")) : conference.url;
    zapierParams.location = conference.city + (conference.state ? ", " + conference.state : "") + ", " + conference.country;
    zapierParams.talks = "";
    zapierParams.overview = conference.overview;
    zapierParams.attendeeGoal = conference.attendeeGoal;
    zapierParams.relationshipGoal = conference.relationshipGoal;
    return models.Talk.find({_id: {$in: approvedSubmissions}});
  }).then(talks => {
    talks.map((talk, index) => {
      zapierParams[`talk${index}`] = talk.title;
      zapierParams.talks += talk.title + "\r\n";
    });
    zapierParams.talks = zapierParams.talks.substr(0, zapierParams.talks.length - 2);
    return models.User.findOne({_id: userId});
  }).then(user => {
    zapierParams.speaker = user.name;
  }).then(() => {
    console.log("Starting Zapier with params", zapierParams);

    return zapier.approved(zapierParams);
  }).catch((err) => console.log("Error sending to Zapier", err)).then(() => {
    res.json(conf);
  });
});

app.post("/api/conference/:id/rejected", authCheck, (req, res) => {
  let userId;

  console.log("Initiating rejection process");

  getMongoUserId(req.headers).then(id => {
    userId = id;
    return models.Conference.findOne({_id: req.params.id});
  }).then(conference => {
    conference.submissions.map(c => {
      if (c.userId.toString() == userId) {
        c.status = models.const.CONF_STATUS.REJECTED;
      }
    });

    return conference.save();
  }).then(conference => {
    res.json(conference);
  });
});

app.post("/api/conference", authCheck, (req, res) => {
  console.log("Adding new conference", req.body);
  models.Conference.create({
    name: req.body.name,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    url: req.body.url,
    cfpUrl: req.body.cfpUrl,
    cfpDate: new Date(req.body.cfpDate),
    twitter: req.body.twitter,
  }).then(conference => {
    res.json(conference);
  });
});

app.put("/api/conference/:id", authCheck,  (req,  res) => {
  console.log("Updating conference", req.body);
  models.Conference.findOneAndUpdate({_id: req.params.id}, req.body).then(conference => {
    res.json(conference);
  });
});

app.get("/api/talks", authCheck, (req, res) => {
  getMongoUserId(req.headers).then(id => {
    return models.Talk.find({userId: id})
  }).then(talks => {
    res.json(talks);
  });
});

app.post("/api/talk", authCheck, (req, res) => {
  console.log("Create new talk");

  getMongoUserId(req.headers).then(id => {
    return models.Talk.create({
      title: req.body.title,
      userId: id
    })
  }).then(talk => {
    res.json(talk);
  });
});

app.get("/api/talk/:id", authCheck,  (req,  res) => {
  models.Talk.findOne({_id: req.params.id}).then(talk => {
    res.json(talk);
  });
});

app.put("/api/talk/:id", authCheck,  (req,  res) => {
  console.log("Update talk " + req.params.id, req.body);

  models.Talk.findOneAndUpdate({_id: req.params.id}, req.body).then(talk => {
    res.json(talk);
  });
});

app.post("/api/conference/:id/submissions", authCheck, (req, res) => {
  let userId;

  console.log("User submitted to conference");

  getMongoUserId(req.headers).then(id => {
    userId = id;
    return models.Conference.findOne({_id: req.params.id});
  }).then(conference => {
    req.body.map(submission => {
      conference.submissions.push({
        talkId: submission.talkId,
        userId: userId,
        status: models.const.CONF_STATUS.NULL
      });
    });
    return conference.save();
  }).then(conference => {
    res.json(conference);
  });
});

app.get("/api/user", authCheck, (req, res) => {
  getMongoUserId(req.headers).then(id => {
    models.User.findOne({_id: id}).then(profile => {
      res.json(profile);
    });
  });
});

app.post("/api/user", authCheck, (req, res) => {
  console.log("Updates to user profile", req.body);

  getMongoUserId(req.headers).then(id => {
    const userData = {
      auth0Id: getUserId(req.headers)
    };
    if (req.body.name) userData.name = req.body.name;
    if (req.body.picture) userData.picture = req.body.picture;
    if (req.body.bio) userData.bio = req.body.bio;
    if (!id) {
      models.User.create(userData);
    } else {
      models.User.findOneAndUpdate({
        _id: id
      }, userData, { upsert: true}).then(data => {
        res.json(data);
      });
    }
  });
});

app.get("/api/meetups", authCheck, (req, res) => {
  getMongoUserId(req.headers).then(id => {
    return models.Meetup.find({userId: id, status: {$in: [models.const.MEETUP_STATUS.APPLIED, models.const.MEETUP_STATUS.CONFIRMED]}}).populate("userId");
  }).then(meetups => {
    res.json(meetups);
  });
});

app.get("/api/meetup/:meetupId", authCheck, (req, res) => {
  models.Meetup.findOne({_id: req.params.meetupId})
  .populate("userId").populate("talkId")
  .then(meetup => {
    res.json(meetup);
  });
});

app.put("/api/meetup/approved/:meetupId", authCheck,  (req,  res) => {
  let userId;
  let zapierParams = {};
  let meetup = {};

  console.log("Meetup is approved, starting Zapier sequence");

  getMongoUserId(req.headers).then(id => {
    userId = id;
    req.body.status = models.const.MEETUP_STATUS.CONFIRMED;

    return models.Meetup.findOneAndUpdate({_id: req.params.meetupId}, req.body);
  }).then(data => {
    console.log("Updated meetup ", data);
    return models.Meetup.findOne({_id: req.params.meetupId}).populate("Talk");
  }).then(data=>console.log("Populated meetup", data)).then(m => {
    meetup = m;
    zapierParams.meetupId = meetup._id;
    zapierParams.conference = meetup.name;
    zapierParams.start = helpers.dateFormat(meetup.startDate);
    zapierParams.dates = zapierParams.start;
    zapierParams.website = `https://meetup.com/${meetup.urlname}`;
    zapierParams.location = meetup.location;
    zapierParams.attendeeGoal = meetup.attendeeGoal;

    console.log("Preparing zapier params", zapierParams);
    console.log("Just need to find the talk " + meetup.talkId);

    return models.Talk.findOne({_id: meetup.talkId});
  }).then(talk => {

    console.log("Found talk", talk);

    zapierParams.talks = talk.title;

    return models.User.findOne({_id: userId});
  }).then(user => {
    zapierParams.speaker = user.name;

    return zapierParams;
  }).then(params => {
    console.log("Starting Zapier sequence with params", params);

    Zapier.meetupApproved(params);
  }).then(() => {
    res.json(meetup);
  });
});

app.post("/api/meetup/applied", authCheck, (req, res) => {
  console.log("User applied to meetup");

  getMongoUserId(req.headers).then(id => {
    return models.Meetup.create({
      meetupUrlName: req.body.meetupUrlName,
      suggestedDateStart: new Date(req.body.suggestedDateStart),
      suggestedDateEnd: new Date(req.body.suggestedDateEnd),
      confirmedDate: null,
      name: req.body.name,
      location: req.body.location,
      status: models.const.MEETUP_STATUS.APPLIED,
      userId: id
    });
  }).then(meetup => {
    res.json(meetup);
  });
});

app.post("/api/meetup/rejected/:id", authCheck, (req, res) => {
  console.log("Rejected from meetups :(");

  models.Meetup.findOneAndUpdate({
    _id: req.params.id
  }, {
    status: models.const.MEETUP_STATUS.REJECTED
  }).then(data => res.json(data));
});

app.post("/api/meetup/dropped/:id", authCheck, (req, res) => {
  console.log("Meetup flagged as fuck it");

  models.Meetup.findOneAndUpdate({
    _id: req.params.id
  }, {
    status: models.const.MEETUP_STATUS.DROPPED
  }).then(data => res.json(data));});

app.get("*", (req, res) => {
  res.sendFile(__dirname + "/dist/index.html");
});

app.listen(PORT, () => {
  console.log("Server ready, listening on port " + PORT);
});

