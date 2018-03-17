import axios from "axios";
import { getAccessToken } from "./auth";

const BASE_URL = "http://localhost:3333";

function getHeaders() {
  const authToken = getAccessToken();
  return authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : { headers: {} };
}

function getConferences() {
  const url = `${BASE_URL}/api/conferences`;
  return axios.get(url, getHeaders()).then(resp => resp.data);
}

function addConference(data) {
  const url = `${BASE_URL}/api/conference`;
  return axios.post(url, data, getHeaders()).then(resp => resp.data);
}

function getTalks() {
  const url = `${BASE_URL}/api/talks`;
  const authToken = getAccessToken();
  const headers = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
  return axios.get(url, headers).then(resp => resp.data);
}

export { getConferences, getTalks, addConference };
