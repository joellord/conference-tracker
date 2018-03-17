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
  knex.select().table("conferences").then(data => res.json(data));
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

app.listen(port);
console.log(`https://${creds.DOMAIN}/.well-known/jwks.json`);
console.log("Server ready, listening on port " + port);
