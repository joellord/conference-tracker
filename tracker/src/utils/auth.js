import decode from "jwt-decode";
import auth0 from "auth0-js";
import Router from "vue-router";

import creds from "../../../credentials";


const ID_TOKEN_KEY = "id_token";
const ACCESS_TOKEN_KEY = "access_token";

const CLIENT_ID = creds.CLIENT_ID;
const CLIENT_DOMAIN = creds.DOMAIN;
const REDIRECT = creds.REDIRECT;
const SCOPE = creds.SCOPE;
const AUDIENCE = creds.AUDIENCE;

const auth = new auth0.WebAuth({
  clientID: CLIENT_ID,
  domain: CLIENT_DOMAIN
});

export function login() {
  auth.authorize({
    responseType: "token id_token",
    redirectUri: REDIRECT,
    audience: AUDIENCE,
    scope: SCOPE
  });
}

const router = new Router({
  mode: "history"
});

function clearIdToken() {
  localStorage.removeItem(ID_TOKEN_KEY);
}

function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function logout() {
  clearIdToken();
  clearAccessToken();
  router.go("/");
}

export function getIdToken() {
  return localStorage.getItem(ID_TOKEN_KEY);
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

export function requireAuth(to, from, next) {
  if (!isLoggedIn()) {
    next({
      path: "/",
      query: { redirect: to.fullPath }
    });
  } else {
    next();
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// Helper function that will allow us to extract the access_token and id_token
function getParameterByName(name) {
  const match = RegExp(`[#&]${name}=([^&]*)`).exec(window.location.hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

// Get and store access_token in local storage
export function setAccessToken() {
  const accessToken = getParameterByName("access_token");
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

// Get and store id_token in local storage
export function setIdToken() {
  const idToken = getParameterByName("id_token");
  localStorage.setItem(ID_TOKEN_KEY, idToken);
}
