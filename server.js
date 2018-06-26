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
    return models.Conference.find({});
  }).then(conferences => {
    let confs = conferences.map(conference => {
      let conf = Object.assign({}, conference.toObject());
      conf.myApproved = conference.submissions.filter(s => s.status === models.const.CONF_STATUS.APPROVED && s.userId == userId).length;
      conf.myRejected = conference.submissions.filter(s => s.status === models.const.CONF_STATUS.REJECTED && s.userId == userId).length;
      conf.mySubmissions = conference.submissions.filter(s => s.status === models.const.CONF_STATUS.NULL && s.userId == userId).length;
      return conf;
    });
    return confs;
  }).then(conferences => {
    res.json(conferences)
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
      if (userIds.indexOf(s.userId) === -1) userIds.push(s.usedId);
    });
    return models.User.find({"_id.$oid": {$in: userIds}});
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
    return conference.submissions.filter(c => c.userId == userId);
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

  // Zapier stuff
  let zapierParams = {};

  getMongoUserId(req.headers).then(id => {
    userId = id;
    return models.Conference.findOne({_id: req.params.id});
  }).then(conference => {
    conference.submissions.map(c => {
      if (c.userId == userId) {
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
    zapierParams.start = (new Date(conference.startDate)).toDateString();
    zapierParams.end = (new Date(conference.endDate)).toDateString();
    zapierParams.dates = conference.endDate ? `${zapierParams.start} to ${zapierParams.end}` : zapierParams.start;
    zapierParams.twitter = conference.twitter;
    zapierParams.website = conference.url;
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
    return zapier.approved(zapierParams);
  }).catch((err) => console.log("Error sending to Zapier", err)).then(() => {
    res.json(conf);
  });
});

app.post("/api/conference/:id/rejected", authCheck, (req, res) => {
  let userId;
  getMongoUserId(req.headers).then(id => {
    userId = id;
    return models.Conference.findOne({_id: req.params.id});
  }).then(conference => {
    conference.submissions.map(c => {
      if (c.userId == userId) {
        c.status = models.const.CONF_STATUS.REJECTED;
      }
    });

    return conference.save();
  }).then(conference => {
    res.json(conference);
  });
});

app.post("/api/conference", authCheck, (req, res) => {
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
  models.Conference.findOneAndUpdate({_id: req.params.id}, req.body).then(conference => {
    res.json(conference);
  });
});

app.get("/api/conference/slk", null, (req, res) => {
  const params = extractQueryParams(req.url);
  const conferenceId = params.conference_id;
  const slkLink = params.slk_link;

  models.Conference.findOneAndUpdate({_id: conferenceId}, {slkLink}).then(conference => {
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
  models.Talk.findOneAndUpdate({_id: req.params.id}, req.body).then(talk => {
    res.json(talk);
  });
});

app.post("/api/conference/:id/submissions", authCheck, (req, res) => {
  let userId;
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

app.get("*", (req, res) => {
  res.sendfile(__dirname + "/dist/index.html");
});

app.listen(PORT, () => {
  console.log("Server ready, listening on port " + PORT);
});

