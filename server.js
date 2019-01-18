const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwtDecode = require("jwt-decode");
const axios = require("axios");

const mysql = require("mysql");

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

const connection = mysql.createConnection(CONNECTION_STRING);

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

  let p = new Promise ((res, rej) => {
    const conditions = {auth0Id: userId};
    connection.query("SELECT * FROM users WHERE ?", conditions, (err, result) => {
      if (err) return rej(err);
      if (result.length === 0) return res(null);
      return res(result[0].id);
    });
  });
  return p;
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

const query = (sql, params) => {
  let p = new Promise((resolve, reject) => {
    if (params) {
      connection.query(sql, params, (err, result) => {
        if(err) return reject(err);

        return resolve(result);
      });
    } else {
      connection.query(sql, (err, result) => {
        if(err) return reject(err);

        return resolve(result);
      });
    }
  });
  return p;
};

const queryOne = (sql, params) => {
  return query(sql, params).then(data => data[0]);
};

app.use(express.static("dist"));

app.get("/api/public", (req, res) => {
  res.json({value: "Hello"});
});

app.get("/api/conferences", authCheck, (req, res) => {
  let userId;
  getMongoUserId(req.headers).then(id => {
    userId = id;

    let sql = `SELECT conferences.*, conferences.id _id,
        (SELECT COUNT(id) FROM submissions WHERE status = "APPROVED" AND userId = ${userId} AND conferenceId = conferences.id) myApproved,
        (SELECT COUNT(id) FROM submissions WHERE status = "REJECTED" AND userId = ${userId} AND conferenceId = conferences.id) myRejected,
        (SELECT COUNT(id) FROM submissions WHERE status = "NULL" AND userId = ${userId}  AND conferenceId = conferences.id) mySubmissions
        FROM conferences
        WHERE startDate > ${(new Date()).getTime()}`;

    return query(sql);
  }).then(conferences => {
    let confs = conferences.map(conference => {
      let conf = Object.assign({}, conference);
      conf.expired = conf.mySubmissions === 0 && conference.cfpDate < (new Date()).getTime();
      conf.rejected = !!(!conf.myApproved && conf.myRejected);

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
  let upcoming = [];

  let sql = `SELECT c.*, c.id _id, GROUP_CONCAT(DISTINCT u.name SEPARATOR ", ") speakers, s.status, "CONFERENCE" type
      FROM conferences c, users u, submissions s
      WHERE s.conferenceId = c.id 
        AND s.userId = u.id 
        AND s.status = "APPROVED"
        AND c.startDate > ${(new Date()).getTime()} 
      GROUP BY c.name`;

  query(sql).then(conferences => {
    upcoming = upcoming.concat(conferences);

    let sql = `SELECT m.*, m.id _id, u.name speakers, "MEETUP" type, CONCAT("https://www.meetup.com/", m.meetupUrlName) url
      FROM meetups m, users u
      WHERE m.userId = u.id AND m.status = "CONFIRMED" AND m.startDate > ${(new Date()).getTime()}`;

    return query(sql);
  }).then(meetups => {
    upcoming = upcoming.concat(meetups);

    upcoming = upcoming.sort((a, b) => {
      if (a.startDate < b.startDate) return -1;
      return 1;
    });

    res.json(upcoming);
  });
});

app.get("/api/conference/slk", (req, res) => {
  const params = extractQueryParams(req.url);
  const conferenceId = params.conference_id;
  const slkLink = params.slk_link;

  let sql = `UPDATE conferences SET slkLink = ? WHERE id = ?`;

  query(sql, [slkLink, conferenceId]).then(result => {
    console.log("SLK Link updated to " + slkLink, result);
    res.json(result);
  });
});

app.get("/api/conference/:id", authCheck, (req, res) => {
  let conferenceId = req.params.id;
  let fullConference;

  let sql = `SELECT *, id _id FROM conferences WHERE id = ?`;
  queryOne(sql, [conferenceId]).then(conference => {
    fullConference = conference;

    let sql = `SELECT s.*, t.title, u.name
      FROM submissions s, talks t, users u
      WHERE s.talkId = t.id AND s.userId = u.id AND s.conferenceId = ?`;

    return query(sql, [conferenceId]);
  }).then(submissions => {
    fullConference.submissions = [];
    submissions.map(s => {
      fullConference.submissions.push({
        talk: {title: s.title},
        user: {name: s.name},
        status: s.status
      });
    });

    return fullConference;
  }).then(data => {
    res.json(data);
  }).catch(err => console.log(err));
});

app.get("/api/conference/:id/submissions", authCheck, (req, res) => {
  let userId;
  let conferenceId = req.params.id;

  getMongoUserId(req.headers).then(id => {
    userId = id;
    let sql = `SELECT s.*, t.*, t.id _id 
      FROM submissions s, talks t 
      WHERE s.talkId = t.id AND conferenceId = ? AND s.userId = ?`;

    return query(sql, [conferenceId, userId]);
  }).then(result => {
    res.json(result);
  });
});

app.post("/api/conference/:id/approvals", authCheck, (req, res) => {
  const approvedSubmissions = req.body;
  let userId;
  let conference;
  let conferenceId = req.params.id;

  console.log("Accepted at conference, starting Zapier sequence");

  // Zapier stuff
  let zapierParams = {};

  getMongoUserId(req.headers).then(id => {
    userId = id;
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [conferenceId]);
  }).then(data => {
    conference = data;

    let sql = `UPDATE submissions SET status = "APPROVED" 
    WHERE conferenceId = ? 
    AND talkId IN (?)`;

    return query(sql, [conferenceId, approvedSubmissions]);
  }).then(_ => {
    let sql = `UPDATE submissions SET status = "REJECTED" 
    WHERE conferenceId = ?
    AND talkId NOT IN (?)`;

    return query(sql, [conferenceId, approvedSubmissions]);
  }).catch((err) => console.log("Error saving approvals", err)).then(_ => {
    zapierParams.conferenceId = conference.id;
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

    let sql = `SELECT t.* FROM talks t, submissions s WHERE s.talkId = t.id AND t.id IN (?) AND s.conferenceId = ?`;
    return query(sql, [approvedSubmissions, conferenceId]);
  }).then(talks => {
    talks.map((talk, index) => {
      zapierParams[`talk${index}`] = talk.title;
      zapierParams.talks += talk.title + "\r\n";
    });
    zapierParams.talks = zapierParams.talks.substr(0, zapierParams.talks.length - 2);

    let sql = `SELECT * FROM users WHERE id = ?`;
    return queryOne(sql, [userId]);
  }).then(user => {
    zapierParams.speaker = user.name;
    zapierParams.communityUsername = user.communityUsername || user.name;
  }).then(() => {
    console.log("Starting Zapier with params", zapierParams);

    return zapier.approved(zapierParams);
  }).catch((err) => console.log("Error sending to Zapier", err)).then(() => {
    res.json(conference);
  });
});

app.post("/api/conference/:id/rejected", authCheck, (req, res) => {
  let userId;
  let conferenceId = req.params.id;

  console.log("Initiating rejection process");

  getMongoUserId(req.headers).then(id => {
    userId = id;
    let sql = `UPDATE submissions SET status = "REJECTED" WHERE conferenceId = ? AND userId = ?`;

    return query(sql, [conferenceId, userId]);
  }).then(_ => {
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [conferenceId]);
  }).then(conference => {
    res.json(conference);
  });
});

app.post("/api/conference", authCheck, (req, res) => {
  console.log("Adding new conference", req.body);
  let sql = `INSERT INTO conferences SET ?`;

  query(sql, [req.body]).then(result => {
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [result.insertId]);
  }).then(conference => {
    res.json(conference);
  });
});

app.put("/api/conference/:id", authCheck,  (req,  res) => {
  console.log("Updating conference", req.body);
  let data = req.body;
  let conferenceId = req.params.id;
  delete data.id;
  delete data._id;
  // Ignore submissions
  delete data.submissions;
  console.log("Updating conference with ", data);
  let sql = `UPDATE conferences SET ? WHERE id = ?`;
  query(sql, [data, conferenceId]).then(_ => {
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [conferenceId]);
  }).then(conference => {
    res.json(conference);
  });
});

app.get("/api/talks", authCheck, (req, res) => {
  getMongoUserId(req.headers).then(id => {
    let sql = `SELECT *, id _id FROM talks WHERE userId = ?`;
    return query(sql, [id]);
  }).then(talks => {
    res.json(talks);
  });
});

app.post("/api/talk", authCheck, (req, res) => {
  console.log("Create new talk");

  getMongoUserId(req.headers).then(id => {
    let sql = `INSERT INTO talks SET ?`;
    let talk = {title: req.body.title, userId: id};
    return query(sql, [talk]);
  }).then(talk => {
    res.json(talk);
  });
});

app.get("/api/talk/:id", authCheck,  (req,  res) => {
  queryOne(`SELECT * FROM talks WHERE id = ?`, [req.params.id]).then(talk => {
    res.json(talk);
  });
});

app.put("/api/talk/:id", authCheck,  (req,  res) => {
  console.log("Update talk " + req.params.id, req.body);
  let data = req.body;
  delete data.id;
  let talkId = req.params.id;
  let sql = `UPDATE talks SET ? WHERE id = ?`;
  query(sql, [data, talkId]).then(_ => {
    return queryOne(`SELECT * FROM talks WHERE id = ?`, [talkId]);
  }).then(talk => {
    res.json(talk);
  });
});

app.post("/api/conference/:id/submissions", authCheck, (req, res) => {
  let userId;
  let conferenceId = req.params.id;

  console.log("User submitted to conference");

  getMongoUserId(req.headers).then(id => {
    userId = id;
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [conferenceId]);
  }).then(conference => {
    let inserts = [];

    req.body.map(submission => {
      let data = {talkId: submission.talkId, userId: userId, status: "NULL", conferenceId: conferenceId};
      console.log("Submitting", data);
      inserts.push(query(`INSERT INTO submissions SET ?`, [data]));
    });

    return Promise.all(inserts);
  }).then(_ => {
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [req.params.id]);
  }).then(conference => {
    res.json(conference);
  });
});

app.get("/api/user", authCheck, (req, res) => {
  getMongoUserId(req.headers).then(id => {
    return queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
  }).then(profile => {
    res.json(profile);
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
    let sql = "";
    if (!id) {
      sql = "INSERT INTO users SET ?";
    } else {
      sql = `UPDATE users SET ? WHERE id = ${id}`;
    }
    query(sql, [userData]).then(result => res.json(result));
  });
});

app.get("/api/meetups", authCheck, (req, res) => {
  getMongoUserId(req.headers).then(id => {
    let sql = `SELECT m.*, m.id _id 
      FROM meetups m, users u 
      WHERE m.userId = u.id 
        AND (
          m.status = "APPLIED" OR
          (m.status = "CONFIRMED" and m.startDate > ${(new Date()).getTime()})
        )
        AND m.status IN ("APPLIED", "CONFIRMED") 
        AND u.id = ?
      ORDER BY m.startDate`;
    return query(sql, [id]);
  }).then(meetups => {
    res.json(meetups);
  });
});

app.get("/api/meetup/:meetupId", authCheck, (req, res) => {
  let meetup;
  queryOne(`SELECT * FROM meetups WHERE id = ?`, [req.params.meetupId]).then(data => {
    meetup = data;

    return queryOne(`SELECT * FROM users WHERE id = ?`, [meetup.userId]);
  }).then(user => {
    meetup.userId = user;

    return queryOne(`SELECT * FROM talks WHERE id = ?`, [meetup.talkId]);
  }).then(talk => {
    meetup.talkId = talk;

    res.json(meetup);
  });
});

app.put("/api/meetup/approved/:meetupId", authCheck,  (req,  res) => {
  let userId;
  let zapierParams = {};
  let meetup = {};
  let meetupIncomingData = req.body;

  console.log("Meetup is approved, starting Zapier sequence");

  getMongoUserId(req.headers).then(id => {
    userId = id;
    meetupIncomingData.status = "CONFIRMED";
    meetupIncomingData.startDate = (new Date(meetupIncomingData.startDate)).getTime();
    delete meetupIncomingData.userId;

    console.log("Updating meetup", meetupIncomingData);
    return query(`UPDATE meetups SET ? WHERE id = ?`, [meetupIncomingData, req.params.meetupId]);
  }).then(data => {
    console.log("Updated meetup ", data);
    let sql = `SELECT m.*, u.name speaker, t.title 
      FROM meetups m, users u, talks t
      WHERE m.talkId = t.id
        AND t.userId = u.id
        AND m.id = ?`;
    return queryOne(sql, [req.params.meetupId]);
  }).then(m => {
    meetup = m;

    console.log("Preparing zapier params", zapierParams);

    zapierParams.meetupId = meetup.id;
    zapierParams.conference = meetup.name;
    zapierParams.start = helpers.dateFormat(meetup.startDate);
    zapierParams.dates = zapierParams.start;
    zapierParams.website = `https://meetup.com/${meetup.meetupUrlName}`;
    zapierParams.location = meetup.location;
    zapierParams.attendeeGoal = meetup.attendeeGoal;
    zapierParams.talks = meetup.title;
    zapierParams.speaker = meetup.speaker;

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
    let data = {
      meetupUrlName: req.body.meetupUrlName,
      suggestedDateStart: new Date(req.body.suggestedDateStart).getTime(),
      suggestedDateEnd: new Date(req.body.suggestedDateEnd).getTime(),
      startDate: null,
      name: req.body.name,
      location: req.body.location,
      status: "APPLIED",
      userId: id
    };
    return query(`INSERT INTO meetups SET ?`, [data]);
  }).then(result => {
    console.log(result);
    return queryOne(`SELECT * FROM meetups WHERE id = ?`, [result.insertId]);
  }).then(meetup => {
    res.json(meetup);
  });
});

app.post("/api/meetup/rejected/:id", authCheck, (req, res) => {
  console.log("Rejected from meetups :(");

  let sql = `UPDATE meetups SET status = "REJECTED" WHERE id = ?`;
  query(sql, [req.params.id]).then(result => {
    res.json(result);
  });
});

app.post("/api/meetup/dropped/:id", authCheck, (req, res) => {
  console.log("Meetup flagged as fuck it");

  let sql = `UPDATE meetups SET status = "DROPPED" WHERE id = ?`;
  query(sql, [req.params.id]).then(result => {
    res.json(result);
  });
});

app.get("*", (req, res) => {
  res.sendFile(__dirname + "/dist/index.html");
});

app.listen(PORT, () => {
  console.log("Server ready, listening on port " + PORT);
});

