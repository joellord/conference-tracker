const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const cors = require("cors");
const bodyParser = require("body-parser");
// const creds = require("./credentials");
const jwtDecode = require("jwt-decode");
const mongoose = require("mongoose");
const axios = require("axios");

const models = require("./schemas");

// const CONNECTION_STRING = creds.DB_CONN_STRING;
const CONNECTION_STRING = process.env.CONNECTION_STRING;
const PORT = 3333;

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

getMongoUserId = (headers) => {
  const userId = getUserId(headers);
  return models.User.findOne({auth0Id: userId}).then(user => user._id).catch(() => undefined);
};

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
  models.Conference.findOne({_id: req.params.id}).then(conf => res.json(conf));
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
  const AddToSheetUrl = "https://hooks.zapier.com/hooks/catch/3069472/kiv6sa/?";
  let queryParams = {};

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
    queryParams.conference = conference.name;
    queryParams.start = (new Date(conference.startDate)).toDateString();
    queryParams.end = (new Date(conference.endDate)).toDateString();
    queryParams.twitter = conference.twitter;
    queryParams.location = conference.city + (conference.state ? ", " + conference.state : "") + ", " + conference.country;
    return models.Talk.find({_id: {$in: approvedSubmissions}});
  }).then(talks => {
    talks.map((talk, index) => {
      queryParams[`talk${index}`] = talk.title;
    });
    return models.User.findOne({_id: userId});
  }).then(user => {
    queryParams.speaker = user.name;
  }).then(() => {
    let url = AddToSheetUrl + encodeURI(Object.entries(queryParams).map(i => i[0] + "=" + i[1]).join("&"));

    return axios.get(url);
  }).catch(() => console.log("Error sending to Zapier")).then(() => {
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

app.post("/api/user", authCheck, (req, res) => {
  getMongoUserId(req.headers).then(id => {
    const userData = {
      auth0Id: getUserId(req.headers),
      name: req.body.name,
      picture: req.body.picture
    };
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

app.listen(PORT, () => {
  console.log("Server ready, listening on port " + PORT);
});

