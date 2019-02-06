import axios from "axios";
import { getAccessToken } from "./auth";

const BASE_URL = "https://wt-13aebf4eeaa9913542725d4a90e4d49e-0.sandbox.auth0-extend.com/meetupfinder";

function getHeaders() {
  const authToken = getAccessToken();
  return {
    headers: {
      Authorization: authToken ? `Bearer ${authToken}` : undefined
    }
  };
}

function getMeetup(urlname) {
  const url = `${BASE_URL}/meetup/${urlname}`;
  return axios.get(url, getHeaders()).then(resp => resp.data);
}

function getMeetups(latlng) {
  const url = `${BASE_URL}/meetups?lat=${latlng.lat}&lon=${latlng.lng}`;
  return axios.get(url, getHeaders()).then(resp => resp.data);
}

export {
  getMeetup,
  getMeetups
};
