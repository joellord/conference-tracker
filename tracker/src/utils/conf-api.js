import axios from "axios";
import { getAccessToken } from "./auth";

const BASE_URL = "http://localhost:3333";

export { getConferences };

function getConferences() {
  const url = `${BASE_URL}/api/protected`;
  const authToken = getAccessToken();
  const headers = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
  return axios.get(url, headers).then(resp => resp.data);
}
