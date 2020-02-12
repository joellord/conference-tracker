const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwtDecode = require("jwt-decode");

const mysql = require("mysql");

const events = require("./server-utils/events");
const helpers = require("./server-utils/helpers");
// const expressPermissions = require("express-jwt-permissions");

const now = helpers.now;
const yesterday = helpers.yesterday;

let creds = process.env; // require("./credentials");

// if (process.env.NODE_ENV === "prod") {
//   creds = process.env;
// } else {
// creds = require("./credentials");
// }

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

// const guard = expressPermissions();

const getUserId = (headers) => {
  if (!headers.Authorization && !headers.authorization) return null;
  const token = (headers.Authorization || headers.authorization).split(" ")[1];
  const decoded = jwtDecode(token);
  if (!decoded.sub) return null;

  return decoded.sub;
};

const getDBUserId = (headers) => {
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
console.log(`Serving static from ${process.env.UI_BUILD}`);
app.use(express.static(process.env.UI_BUILD || "dist"));

app.get("/api/public", (req, res) => {
  res.json({value: "Hello"});
});

app.get("/api/conferences", [authCheck], (req, res) => {
  let userId;
  getDBUserId(req.headers).then(id => {
    userId = id;

    let sql = `SELECT conferences.*, conferences.id _id,
        (SELECT COUNT(id) FROM submissions WHERE status = "APPROVED" AND userId = ${userId} AND conferenceId = conferences.id) myApproved,
        (SELECT COUNT(id) FROM submissions WHERE status = "REJECTED" AND userId = ${userId} AND conferenceId = conferences.id) myRejected,
        (SELECT COUNT(id) FROM submissions WHERE status = "NULL" AND userId = ${userId}  AND conferenceId = conferences.id) mySubmissions
        FROM conferences
        WHERE startDate > ${now()}`;

    return query(sql);
  }).then(conferences => {
    let confs = conferences.map(conference => {
      let conf = Object.assign({}, conference);
      conf.expired = conf.mySubmissions === 0 && conference.cfpDate < yesterday();
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

app.get("/api/upcoming/:week?", (req, res) => {
  let users = [];
  let upcoming = [];

  let sql = `SELECT c.*, c.id _id, GROUP_CONCAT(DISTINCT u.name SEPARATOR ", ") speakers, s.status, "CONFERENCE" type
      FROM conferences c, users u, submissions s
      WHERE s.conferenceId = c.id 
        AND s.userId = u.id 
        AND s.status = "APPROVED"
        AND c.startDate > ${now()} 
        ${req.params.week ? 'AND c.startDate < ' + (now() + 7*24*60*60*1000) : ''}
      GROUP BY c.id`;

  query(sql).then(conferences => {
    upcoming = upcoming.concat(conferences);

    let sql = `SELECT m.*, m.id _id, u.name speakers, "MEETUP" type, CONCAT("https://www.meetup.com/", m.meetupUrlName) url
      FROM meetups m, users u
      WHERE m.userId = u.id AND m.status = "CONFIRMED" AND m.startDate > ${now()} 
      ${req.params.week ? 'AND m.startDate < ' + (now() + 7*24*60*60*1000) : ''}`;

    return query(sql);
  }).then(meetups => {
    upcoming = upcoming.concat(meetups);

    upcoming = upcoming.map(u => {
      if (u.location) return u;

      u.location  = u.state ? `${u.city}, ${u.state}, ${u.country}` : `${u.city}, ${u.country}`;
      return u;
    });

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

app.get("/api/conference/:id", [authCheck], (req, res) => {
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

app.get("/api/conference/:id/submissions", [authCheck], (req, res) => {
  let userId;
  let conferenceId = req.params.id;

  getDBUserId(req.headers).then(id => {
    userId = id;
    let sql = `SELECT s.*, t.*, t.id _id 
      FROM submissions s, talks t 
      WHERE s.talkId = t.id AND conferenceId = ? AND s.userId = ?`;

    return query(sql, [conferenceId, userId]);
  }).then(result => {
    res.json(result);
  });
});

app.post("/api/conference/:id/approvals", [authCheck], (req, res) => {
  const approvedSubmissions = req.body;
  let userId;
  let conference;
  let conferenceId = req.params.id;
  let hookData = {};

  console.log("Accepted at conference, starting accepted sequence");

  getDBUserId(req.headers).then(id => {
    userId = id;
    return queryOne(`SELECT c.*, r.roadmapValue AS region 
      FROM conferences c, regions r 
      WHERE c.regionId = r.id 
        AND c.id = ?`, [conferenceId]);
  }).then(data => {
    conference = data;

    let sql = `UPDATE submissions SET status = "APPROVED" 
    WHERE conferenceId = ? 
    AND talkId IN (?)`;

    return query(sql, [conferenceId, approvedSubmissions]);
  }).then(_ => {
    let sql = `UPDATE submissions SET status = "REJECTED" 
    WHERE conferenceId = ?
    AND userId = ?
    AND talkId NOT IN (?)`;

    return query(sql, [conferenceId, userId, approvedSubmissions]);
  }).catch((err) => console.log("Error saving approvals", err)).then(_ => {
    return queryOne(`SELECT c.id, c.name, c.startDate, c.endDate, c.city, c.state, c.country, c.url, c.twitter, 
      c.relationshipGoal, c.attendeeGoal, c.overview, r.region, r.roadmapValue AS regionRoadmapValue 
      FROM conferences c, regions r 
      WHERE c.regionId = r.id AND c.id = ?`, [conference.id]);
  }).then(confDetails => {
    hookData.conference = Object.assign({}, confDetails);
    return query(`SELECT t.id, t.title, t.abstract, t.notes 
      FROM talks t, submissions s 
      WHERE s.talkId = t.id AND t.id IN (?) AND s.conferenceId = ?`, [approvedSubmissions, conferenceId]);
  }).then(talkDetails => {
    hookData.talks = talkDetails.map(t => Object.assign({}, t));
    return queryOne(`SELECT u.name, u.picture, u.bio, u.communityUsername, u.email FROM users u WHERE u.id = ?`, [userId]);
  }).then(speakerDetails => {
    hookData.speaker = Object.assign({}, speakerDetails);
    events.acceptedAtConference(hookData.conference, hookData.talks, hookData.speaker);
  }).catch((err) => console.log("Error sending to external hook", err)).then(() => {
    res.json(conference);
  });
});

app.post("/api/conference/:id/rejected", [authCheck], (req, res) => {
  let userId;
  let conferenceId = req.params.id;
  let hookData = {};

  console.log("Initiating rejection process");

  getDBUserId(req.headers).then(id => {
    userId = id;
    let sql = `UPDATE submissions SET status = "REJECTED" WHERE conferenceId = ? AND userId = ?`;

    return query(sql, [conferenceId, userId]);
  }).then(_ => {
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [conferenceId]);
  }).then(conference => {
    hookData.conference = conference;

    return query(`SELECT * FROM talks WHERE id IN (SELECT talkId FROM submissions WHERE conferenceId = ? and userId = ?)`, [conferenceId, userId]);
  }).then(talks => {
    hookData.talks = talks;

    return queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
  }).then(user => {
    hookData.speaker = user;

    events.rejectedFromConference(hookData.conference, hookData.talks, hookData.speaker);

    res.json(hookData.conference);
  });
});

app.post("/api/conference", [authCheck], (req, res) => {
  console.log("Adding new conference", req.body);
  let sql = `INSERT INTO conferences SET ?`;

  query(sql, [req.body]).then(result => {
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [result.insertId]);
  }).then(conference => {
    res.json(conference);
  });
});

app.put("/api/conference/:id", [authCheck],  (req,  res) => {
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

app.get("/api/talks", [authCheck], (req, res) => {
  getDBUserId(req.headers).then(id => {
    let sql = `SELECT *, id _id FROM talks WHERE userId = ?`;
    return query(sql, [id]);
  }).then(talks => {
    res.json(talks);
  });
});

app.post("/api/talk", [authCheck], (req, res) => {
  console.log("Create new talk");

  getDBUserId(req.headers).then(id => {
    let sql = `INSERT INTO talks SET ?`;
    let talk = {title: req.body.title, userId: id};
    return query(sql, [talk]);
  }).then(talk => {
    res.json(talk);
  });
});

app.get("/api/talk/:id", [authCheck],  (req,  res) => {
  queryOne(`SELECT * FROM talks WHERE id = ?`, [req.params.id]).then(talk => {
    res.json(talk);
  });
});

app.put("/api/talk/:id", [authCheck],  (req,  res) => {
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

app.post("/api/conference/:id/submissions", [authCheck], (req, res) => {
  let userId;
  let conferenceId = req.params.id;

  console.log("User submitted to conference");

  getDBUserId(req.headers).then(id => {
    userId = id;
    return query(`SELECT talkId FROM submissions WHERE userId = ? AND conferenceId = ?`, [userId, conferenceId]);
  }).then(submittedTalks => {
    let inserts = [];
    let talks = submittedTalks.map(t => t.talkId);

    req.body.map(submission => {
      if (talks.indexOf(submission.talkId) === -1) {
        let data = {talkId: submission.talkId, userId: userId, status: "NULL", conferenceId: conferenceId};
        console.log("Submitting", data);
        inserts.push(query(`INSERT INTO submissions SET ?`, [data]));
      }
    });

    talks.map(t => {
      if (!req.body.find(s => s.talkId === t)) {
        console.log("Removing submission " + t);
        inserts.push(query(`DELETE FROM submissions WHERE conferenceId = ? AND userId = ? and talkId = ?`, [conferenceId, userId, t]));
      }
    });

    return Promise.all(inserts);
  }).then(_ => {
    return queryOne(`SELECT * FROM conferences WHERE id = ?`, [req.params.id]);
  }).then(conference => {
    res.json(conference);
  });
});

app.get("/api/user", authCheck, (req, res) => {
  getDBUserId(req.headers).then(id => {
    return queryOne(`SELECT * FROM users WHERE id = ?`, [id]);
  }).then(profile => {
    res.json(profile);
  });
});

app.post("/api/user", authCheck, (req, res) => {
  console.log("Updates to user profile", req.body);

  getDBUserId(req.headers).then(id => {
    const userData = {
      auth0Id: getUserId(req.headers)
    };
    if (req.body.name) userData.name = req.body.name;
    if (req.body.picture) userData.picture = req.body.picture;
    if (req.body.bio) userData.bio = req.body.bio;
    if (req.body.email) userData.email = req.body.email;
    if (req.body.communityUsername) userData. communityUsername = req.body.communityUsername;
    let sql = "";
    if (!id) {
      sql = "INSERT INTO users SET ?";
    } else {
      sql = `UPDATE users SET ? WHERE id = ${id}`;
    }
    query(sql, [userData]).then(result => res.json(result));
  });
});

app.get("/api/meetups", [authCheck], (req, res) => {
  getDBUserId(req.headers).then(id => {
    let sql = `SELECT m.*, m.id _id 
      FROM meetups m, users u 
      WHERE m.userId = u.id 
        AND (
          m.status = "APPLIED" OR
          (m.status = "CONFIRMED" and m.startDate > ${now()})
        )
        AND m.status IN ("APPLIED", "CONFIRMED") 
        AND u.id = ?
      ORDER BY m.startDate`;
    return query(sql, [id]);
  }).then(meetups => {
    res.json(meetups);
  });
});

app.get("/api/meetup/:meetupId", [authCheck], (req, res) => {
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

app.put("/api/meetup/approved/:meetupId", [authCheck],  (req,  res) => {
  let userId;
  let hookData = {};
  let meetupIncomingData = req.body;

  console.log("Meetup is approved, starting meetup accepted sequence");

  getDBUserId(req.headers).then(id => {
    userId = id;
    meetupIncomingData.status = "CONFIRMED";
    meetupIncomingData.startDate = (new Date(meetupIncomingData.startDate)).getTime();
    delete meetupIncomingData.userId;

    console.log("Updating meetup", meetupIncomingData);
    return query(`UPDATE meetups SET ? WHERE id = ?`, [meetupIncomingData, req.params.meetupId]);
  }).then(data => {
    console.log("Updated meetup ", data);
    let sql = `SELECT m.*, u.name speaker, r.roadmapValue AS region, r.roadmapValue AS regionRoadmapValue, t.title 
      FROM meetups m, users u, talks t, regions r
      WHERE m.talkId = t.id
        AND m.regionId = r.id
        AND t.userId = u.id
        AND m.id = ?`;
    return queryOne(sql, [req.params.meetupId]);
  }).then(meetup => {
    hookData.meetup = meetup;

    return queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
  }).then(speaker => {
    hookData.speaker = speaker;

    return queryOne(`SELECT * FROM talks WHERE id = ?`, [hookData.meetup.talkId]);
  }).then(talk => {
    hookData.talk = talk;

    console.log("Starting accepted hook with data ", hookData);
    events.acceptedAtMeetup(hookData.meetup, hookData.talk, hookData.speaker);
  }).then(() => {
    res.json(hookData.meetup);
  }).catch(err => {
    console.log("Error in the accepted at meetup hook", err);
  });
});

app.post("/api/meetup/applied", [authCheck], (req, res) => {
  console.log("User applied to meetup");

  getDBUserId(req.headers).then(id => {
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

app.post("/api/meetup/rejected/:id", [authCheck], (req, res) => {
  console.log("Rejected from meetups :(");

  let sql = `UPDATE meetups SET status = "REJECTED" WHERE id = ?`;
  query(sql, [req.params.id]).then(result => {
    res.json(result);
  });
});

app.post("/api/meetup/dropped/:id", [authCheck], (req, res) => {
  console.log("Meetup flagged as fuck it");

  let sql = `UPDATE meetups SET status = "DROPPED" WHERE id = ?`;
  query(sql, [req.params.id]).then(result => {
    res.json(result);
  });
});

app.get("/api/reports/todo", [authCheck], (req, res) => {
  let reportsTodo = [];
  let userId;
  getDBUserId(req.headers).then(id => {
    userId = id;
    let sql = `SELECT DISTINCT c.id, c.name, "CONFERENCE" AS "type", r.id AS reportId, c.startDate
    FROM conferences c
    JOIN submissions s ON c.id = s.conferenceId
    JOIN users u ON u.id = s.userId
    LEFT JOIN reports r ON r.conferenceId = c.id
    WHERE s.status = "APPROVED"
      AND r.id IS NULL
      AND u.id = ?
      AND c.endDate < ?`;

    return query(sql, [userId, now()]);
  }).then(result => {
    reportsTodo = result;

    let sql = `SELECT m.id, m.name, "MEETUP" AS "type", r.id AS reportId, m.startDate
      FROM meetups m
      JOIN users u ON u.id = m.userId
      LEFT JOIN reports r ON r.meetupId = m.id
      WHERE m.status = "CONFIRMED"
        AND r.id IS NULL
        AND u.id = ? 
        AND m.startDate < ?`;

    return query(sql, [userId, now()]);
  }).then(result => {
    reportsTodo = reportsTodo.concat(result);

    res.json(reportsTodo);
  });
});

app.post("/api/report", [authCheck], (req, res) => {
  console.log("Creating post-event report");

  getDBUserId(req.headers).then(userId => {
    let data = req.body;
    data.userId = userId;
    return query(`INSERT INTO reports SET ?`, [data]);
  }).then(result => {
    let sql = `SELECT r.*, t.type, s.source, reg.region
      FROM reports r, eventTypes t, eventSources s, regions reg
      WHERE r.regionId = reg.id 
        AND r.typeId = t.id
        AND r.sourceId = s.id
        AND r.id = ?`;
    queryOne(sql, [result.insertId]).then(report => {
      events.postConferenceReport(report);

      res.json(report);
    });
  });
});

app.get("/api/notifications", authCheck, (req, res) => {
  let reportsTodo = [];
  let notifications = {
    reports: 0
  };
  let userId;
  getDBUserId(req.headers).then(id => {
    userId = id;
    let sql = `SELECT DISTINCT c.id, c.name, "CONFERENCE" AS "type", r.id AS reportId, c.startDate
    FROM conferences c
    JOIN submissions s ON c.id = s.conferenceId
    JOIN users u ON u.id = s.userId
    LEFT JOIN reports r ON r.conferenceId = c.id
    WHERE s.status = "APPROVED"
      AND r.id IS NULL
      AND u.id = ?
      AND c.endDate < ?`;

    return query(sql, [userId, now()]);
  }).then(result => {
    reportsTodo = result;

    let sql = `SELECT m.id, m.name, "MEETUP" AS "type", r.id AS reportId, m.startDate
      FROM meetups m
      JOIN users u ON u.id = m.userId
      LEFT JOIN reports r ON r.meetupId = m.id
      WHERE m.status = "CONFIRMED"
        AND r.id IS NULL
        AND u.id = ? 
        AND m.startDate < ?`;

    return query(sql, [userId, now()]);
  }).then(result => {
    reportsTodo = reportsTodo.concat(result);
    notifications.reports = reportsTodo.length;

    res.json(notifications);
  });
});

app.get("/api/regions", authCheck, (req, res) => {
  let sql = `SELECT * FROM regions`;

  query(sql, []).then(result => res.json(result));
});

app.get("/api/event-sources", authCheck, (req, res) => {
  query(`SELECT * FROM eventSources`, []).then(result => res.json(result));
});

app.get("/api/event-types", authCheck, (req, res) => {
  query(`SELECT * FROM eventTypes`, []).then(result => res.json(result));
});

app.get("/api/stats", [authCheck], (req, res) => {
  let stats = {};
  let sql = `SELECT COUNT(id) totalEvents, SUM(developersReached) totalDevelopersReached,
      SUM(CASE WHEN regionId = 1 THEN developersReached ELSE 0 END) regionAmericas,
      SUM(CASE WHEN regionId = 2 THEN developersReached ELSE 0 END) regionEMEA,
      SUM(CASE WHEN regionId = 3 THEN developersReached ELSE 0 END) regionAPAC,
      SUM(CASE WHEN regionId = 4 THEN developersReached ELSE 0 END) regionGlobal,
      SUM(CASE WHEN sourceId = 1 THEN developersReached ELSE 0 END) sourceEvangelism,
      SUM(CASE WHEN sourceId = 2 THEN developersReached ELSE 0 END) sourceAmbExt,
      SUM(CASE WHEN sourceId = 3 THEN developersReached ELSE 0 END) sourceAmbInt,
      SUM(CASE WHEN typeId = 1 THEN developersReached ELSE 0 END) typeConference,
      SUM(CASE WHEN typeId = 2 THEN developersReached ELSE 0 END) typeMeetup,
      SUM(CASE WHEN typeId = 3 THEN developersReached ELSE 0 END) typeOnlineMeetup,
      SUM(CASE WHEN typeId = 4 THEN developersReached ELSE 0 END) typeOnlineCourse
    FROM reports 
    WHERE eventDate > ?`;
  let jan1st = (new Date("2019-01-01")).getTime();
  queryOne(sql, [jan1st]).then(general => {
    stats.general = general;

    let sql = `SELECT r.id, r.eventName, r.eventDate, r.developersReached, s.source, t.type, reg.region
      FROM reports r, eventSources s, eventTypes t, regions reg
      WHERE r.sourceId = s.id 
        AND r.typeId = t.id
        AND r.regionId = reg.id
        AND eventDate > ?`;
    return query(sql, [jan1st]);
  }).then(reports => {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    stats.monthly = months.map(m => {
      return {
        month: m,
        total: 0,
        americas: 0,
        emea: 0,
        apac: 0,
        global: 0,
        evangelism: 0,
        ambext: 0,
        ambint: 0,
        conference: 0,
        meetup: 0,
        onlinemeetup: 0,
        onlinecourse: 0
      };
    });
    reports.map(r => {
      let month = (new Date(r.eventDate)).getMonth();
      stats.monthly[month].total += r.developersReached;
      switch(r.region) {
        case "Americas": stats.monthly[month].americas += r.developersReached; break;
        case "EMEA": stats.monthly[month].emea += r.developersReached; break;
        case "APAC": stats.monthly[month].apac += r.developersReached; break;
        case "Global": stats.monthly[month].global += r.developersReached; break;
      }
      switch(r.source) {
        case "Evangelism": stats.monthly[month].evangelism += r.developersReached; break;
        case "Ambassador - External": stats.monthly[month].ambext += r.developersReached; break;
        case "Ambassador - Internal": stats.monthly[month].ambint += r.developersReached; break;
      }
      switch(r.type) {
        case "Conference": stats.monthly[month].conference += r.developersReached; break;
        case "Meetup": stats.monthly[month].conference += r.developersReached; break;
        case "Online Meetup": stats.monthly[month].conference += r.developersReached; break;
        case "Online Course": stats.monthly[month].conference += r.developersReached; break;
      }
    });

    res.json(stats);
  });
});

app.get("*", (req, res) => {
  res.sendFile(`${process.env.UI_BUILD || "./dist"}/index.html`);
});

app.listen(PORT, () => {
  console.log("Server ready, listening on port " + PORT);
});

