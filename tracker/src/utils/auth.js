import decode from "jwt-decode";
import auth0 from "auth0-js";

import { setPermissions } from "./acl";

import creds from "./credentials";

const ID_TOKEN_KEY = "id_token";
const ACCESS_TOKEN_KEY = "access_token";

const CLIENT_ID = creds.CLIENT_ID;
const DOMAIN = creds.DOMAIN;
const REDIRECT = creds.REDIRECT;
const SCOPE = creds.SCOPE;
const AUDIENCE = creds.AUDIENCE;

const auth = new auth0.WebAuth({
  clientID: CLIENT_ID,
  domain: DOMAIN,
  responseType: "token id_token",
  redirectUri: REDIRECT,
  audience: AUDIENCE,
  scope: SCOPE
});

const tokens = {};
const tokenStorage = {
  removeItem: (key) => { tokens[key] = ""; },
  getItem: key => tokens[key],
  setItem: (key, value) => { tokens[key] = value; }
};

let tokenRenewalTimeout;

export function login() {
  auth.authorize({});
}

function clearIdToken() {
  tokenStorage.removeItem(ID_TOKEN_KEY);
}

function clearAccessToken() {
  tokenStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function logout() {
  clearIdToken();
  clearAccessToken();
  clearTimeout(tokenRenewalTimeout);

  auth.logout({
    returnTo: `${location.origin}/`
  });
}

export function getIdToken() {
  return tokenStorage.getItem(ID_TOKEN_KEY);
}

function getTokenExpirationDate(encodedToken) {
  const token = decode(encodedToken);
  if (!token.exp) { return null; }

  const date = new Date(0);
  date.setUTCSeconds(token.exp);

  return date;
}

function isTokenExpired(token) {
  const expirationDate = getTokenExpirationDate(token);
  return expirationDate < new Date();
}

export function isLoggedIn() {
  const idToken = getIdToken();
  return !!idToken && !isTokenExpired(idToken);
}

export function getAccessToken() {
  return tokenStorage.getItem(ACCESS_TOKEN_KEY);
}

// Helper function that will allow us to extract the access_token and id_token
function getParameterByName(name) {
  const match = RegExp(`[#&]${name}=([^&]*)`).exec(window.location.hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

// Get and store access_token in local storage
export function setAccessToken(token) {
  const accessToken = token || getParameterByName("access_token");
  tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  const decodedToken = decode(accessToken);
  setPermissions(decodedToken.permissions);
}

// Get and store id_token in local storage
export function setIdToken(token) {
  const idToken = token || getParameterByName("id_token");
  tokenStorage.setItem(ID_TOKEN_KEY, idToken);
}

export function renewToken(cb) {
  auth.checkSession({}, (err, result) => {
    if (err) {
      return;
    }
    setIdToken(result.idToken);
    setAccessToken(result.accessToken);

    const decoded = decode(result.accessToken);
    const expiry = decoded.exp * 1000;
    const delay = expiry - (new Date()).getTime();

    tokenRenewalTimeout = setTimeout(renewToken, delay - 60000);

    if (cb) {
      cb();
    }
  });
}

export function getUserParam(param) {
  const idData = decode(getIdToken());
  return idData[param];
}

export function getUserImage() {
  return getUserParam("picture");
}
