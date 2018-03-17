import axios from "axios";
import { getAccessToken, getUserParam } from "./auth";

const BASE_URL = "http://localhost:3333";

function getHeaders() {
  const authToken = getAccessToken();
  return authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : { headers: {} };
}

function getConferences() {
  const url = `${BASE_URL}/api/conferences`;
  return axios.get(url, getHeaders()).then(resp => resp.data);
}

function getConference(id) {
  const url = `${BASE_URL}/api/conference/${id}`;
  return axios.get(url, getHeaders()).then(resp => resp.data);
}

function addConference(data) {
  const url = `${BASE_URL}/api/conference`;
  return axios.post(url, data, getHeaders()).then(resp => resp.data);
}

function getMyTalks() {
  const url = `${BASE_URL}/api/talks`;
  return axios.get(url, getHeaders()).then(resp => resp.data);
}

function addTalk(data) {
  const url = `${BASE_URL}/api/talk`;
  data.userId = getUserParam("sub");
  return axios.post(url, data, getHeaders()).then(resp => resp.data);
}

function addSubmissions(data) {
  const url = `${BASE_URL}/api/submissions`;
  return axios.post(url, data, getHeaders()).then(resp => resp.data);
}

export { getConferences, getConference, addConference, getMyTalks, addTalk, addSubmissions };
