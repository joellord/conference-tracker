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
  return axios.get(url, getHeaders()).then(resp => resp.data).then((data) => {
    // Process Meetup data
    let maxMembers = 0;
    let meetups = data.map((i) => {
      if (i.members > maxMembers) maxMembers = i.members;
      if (i.status !== "active" && i.visibility !== "public") {
        return null;
      }

      return {
        id: i.id,
        name: i.name,
        link: i.link,
        description: i.description,
        created: i.created,
        location: `${i.city}, ${i.state}, ${i.country}`,
        coords: { lat: i.lat, lon: i.lon },
        members: i.members || 0,
        who: i.who,
        nextEvent: i.next_event ? i.next_event : { time: undefined, yes_rsvp_count: 0 },
        lastEvent: i.last_event ? i.last_event : { time: undefined, yes_rsvp_count: 0 },
        urlname: i.urlname,
        score: 0
      };
    }).filter(m => m !== null);

    meetups = meetups
      .map((m) => {
        const d = new Date().getTime();
        // 100 points for last meetup in the last 30 days
        // 75 points for last meetup in the last 60 days
        // 50 points for last meetup exists
        // 25 points for next meetup
        // 1-100 ratio to max members
        const ratio = (m.members * 100) / maxMembers;
        m.score += m.lastEvent.time ? 50 : 0;
        const daysSinceLastEvent = Math.floor((d - m.lastEvent.time) / 1000 / 60 / 60 / 24);
        m.score += daysSinceLastEvent < 60 ? 25 : 0;
        m.score += daysSinceLastEvent < 30 ? 25 : 0;
        m.score += m.nextEvent.time ? 25 : 0;
        m.score += ratio;
        return m;
      })
      .sort((a, b) => {
        if (a.score < b.score) return 1;
        if (b.score < a.score) return -1;
        return 0;
      });

    return meetups;
  });
}

export {
  getMeetup,
  getMeetups
};
