const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const cors = require("cors");
const bodyParser = require("body-parser");
const Knex = require("knex");
const DB = require("./db");
const creds = require("./credentials");
const jwtDecode = require("jwt-decode");

const port = 3333;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

const knex = Knex({
  client: "mysql",
  connection: {
    host: DB.HOST,
    user: DB.USER,
    password: DB.PASSWORD,
    database: DB.DB_NAME
  }
});

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

app.get("/api/public", (req, res) => {
  res.json({value: "Hello"});
});

app.get("/api/conferences", authCheck, (req, res) => {

  let userId = getUserId(req.headers);
  // SELECT c.*, count(s.id) totalSubmissions,
  //     (SELECT COUNT(su.id) FROM submissions su, talks ta
  //      WHERE ta.id = su.talkId AND ta.userId = "google-oauth2|102260477336632272051"
  //        AND su.conferenceId = c.id GROUP BY c.id) as mySubmissions
  // from conferences as c left join submissions s on c.id = s.conferenceId
  // group by c.id
  const mySubmissions = knex("submissions AS su")
      .count("su.id")
      .leftJoin("talks AS ta", "su.talkId", "ta.id")
      .where("ta.userId", userId)
      .whereRaw("`su`.`conferenceId` = `c`.`id`")
      .groupBy("c.id");
  const myApproved = knex("submissions AS su")
      .count("su.id")
      .leftJoin("talks AS ta", "su.talkId", "ta.id")
      .where("ta.userId", userId)
      .where("su.approved", true)
      .whereRaw("`su`.`conferenceId` = `c`.`id`")
      .groupBy("c.id");
  const myRejected = knex("submissions AS su")
      .count("su.id")
      .leftJoin("talks AS ta", "su.talkId", "ta.id")
      .where("ta.userId", userId)
      .where("su.rejected", true)
      .whereRaw("`su`.`conferenceId` = `c`.`id`")
      .groupBy("c.id");
  const myUndefined = knex("submissions AS su")
      .count("su.id")
      .leftJoin("talks AS ta", "su.talkId", "ta.id")
      .where("ta.userId", userId)
      .where("su.approved", false)
      .where("su.rejected", false)
      .whereRaw("`su`.`conferenceId` = `c`.`id`")
      .groupBy("c.id");
  const outerSelect = knex("conferences AS c")
      .select("*", "c.id AS conferenceId")
      .count("s.id AS totalSubmissions")
      .select(mySubmissions.as("mySubmissions"))
      .select(myApproved.as("myApproved"))
      .select(myRejected.as("myRejected"))
      .select(myUndefined.as("myUndefined"))
      .leftJoin("submissions AS s", "c.id", "s.conferenceId")
      .groupBy("c.id");

  outerSelect.then(data => res.json(data));
});

app.get("/api/conference/:id", authCheck, (req, res) => {
  knex("conferences").where("id", req.params.id).then(data => res.json(data[0]));
});

app.get("/api/conference/:id/submissions", authCheck, (req, res) => {
  let userId = getUserId(req.headers);
  knex("submissions AS s")
      .columns(["s.id AS submissionId", "t.id", "t.title"])
      .leftJoin("talks AS t", "s.talkId", "t.id")
      .where("t.userId", userId)
      .where("s.conferenceId", req.params.id)
      .then(data => res.json(data));
});

app.post("/api/conference/:id/approvals", authCheck, (req, res) => {
  const approvedSubmissions = req.body;
  const userId = getUserId(req.headers);
  const promiseArray = [
    knex("submissions AS s")
        .leftJoin("talks AS t", "t.id", "s.talkId")
        .where("s.conferenceId", req.params.id)
        .where("t.userId", userId)
        .whereIn("s.id", approvedSubmissions)
        .update({approved: true}),
    knex("submissions AS s")
        .leftJoin("talks AS t", "t.id", "s.talkId")
        .where("s.conferenceId", req.params.id)
        .where("t.userId", userId)
        .whereNotIn("s.id", approvedSubmissions)
        .update({rejected: true}),
  ];

  Promise.all(promiseArray).then(data => res.status(200).send(data));

  // Approval Hooks
  // Add to Sheet:
  // https://hooks.zapier.com/hooks/catch/3069472/kiv6sa/?name=conf&start=date&end=date&location=City,State,Country&speaker=name&talk=title
});

app.post("/api/conference/:id/rejected", authCheck, (req, res) => {
  const userId = getUserId(req.headers);
  knex("submissions AS s")
      .leftJoin("talks AS t", "t.id", "s.talkId")
      .where("s.conferenceId", req.params.id)
      .where("t.userId", userId)
      .update({rejected: true})
      .then(data => res.status(200).send({data}));
});

app.post("/api/conference", authCheck, (req, res) => {
  knex("conferences").insert(req.body).then(record => res.status(200).send(record)).catch(err => console.log(err));
});

app.get("/api/talks", authCheck, (req, res) => {
  let userId = getUserId(req.headers);
  knex("talks").where("userId", userId).then(data => res.json(data));
});

app.post("/api/talk", authCheck, (req, res) => {
  knex("talks").insert(req.body).then(record => res.status(200).send(record)).catch(err => console.log(err));
});

app.post("/api/submissions", authCheck, (req, res) => {
  let promiseArray = [];
  req.body.map((submission) => {
    const op = knex("submissions").where({talkId: submission.talkId, conferenceId: submission.conferenceId}).then(data => {
      if (data.length === 0) {
        return knex("submissions").insert(submission);
      }
    });

    promiseArray.push(op);
  });

  Promise.all(promiseArray).then(data => res.status(200).send(data));
});

app.post("/api/user", authCheck, (req, res) => {
  const userId = getUserId(req.headers);
  knex("users").where("id", userId).then(data => {
    if (data.length === 0) {
      const user = req.body;
      user.id = userId;
      knex("users").insert(user).then(record => res.send(200));
    }
  })
});

app.listen(port);
console.log(`https://${creds.DOMAIN}/.well-known/jwks.json`);
console.log("Server ready, listening on port " + port);
