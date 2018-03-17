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

function getMySubmissions(conferenceId) {
  const url = `${BASE_URL}/api/conference/${conferenceId}/submissions`;
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

function addApprovals(conferenceId, approvals) {
  const url = `${BASE_URL}/api/conference/${conferenceId}/approvals`;
  return axios.post(url, approvals, getHeaders()).then(resp => resp.data);
}

function rejectConference(conferenceId) {
  const url = `${BASE_URL}/api/conference/${conferenceId}/rejected`;
  return axios.post(url, { conferenceId }, getHeaders()).then(resp => resp.data);
}

function createLocalUser(data) {
  const url = `${BASE_URL}/api/user`;
  return axios.post(url, data, getHeaders()).then(resp => resp.data);
}

export {
  getConferences,
  getConference,
  addConference,
  getMyTalks,
  addTalk,
  getMySubmissions,
  addSubmissions,
  addApprovals,
  rejectConference,
  createLocalUser
};
