const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const cors = require("cors");
const bodyParser = require("body-parser");

const creds = require("./credentials");

const port = 3333;

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
  audience: creds.audience,
  issuer: `https://${creds.DOMAIN}`,
  algorithms: ["RS256"]
});

app.get("/api/public", (req, res) => {
  res.json({value: "Hello"});
});

app.get("/api/protected", authCheck, (req, res) => {
  res.json({value: "Protected Hello"});
});

app.listen(port);
console.log("Server ready, listening on port " + port);
