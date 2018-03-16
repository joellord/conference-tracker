const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const cors = require("cors");
const bodyParser = require("body-parser");
const Knex = require("knex");
const DB = require("./db");
const creds = require("./credentials");

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

app.get("/api/public", (req, res) => {
  res.json({value: "Hello"});
});

app.get("/api/conferences", authCheck, (req, res) => {
  knex.select().table("conferences").then(data => res.json(data));
});

app.listen(port);
console.log(`https://${creds.DOMAIN}/.well-known/jwks.json`);
console.log("Server ready, listening on port " + port);
