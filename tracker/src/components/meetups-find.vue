<template>
  <div class="meetups">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Find Meetups</h2>
    <h5>Powered by MeetupFinder.com ;)</h5>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <b-row>
      <b-col cols="8" offset="2">
        <b-form inline>
          <label class="sr-only" for="city">City</label>
          <!--<b-input class="col-8" id="city" placeholder="City" v-model="city" />-->
          <places v-model="city" placeholder="City" @change="changeLocation"/>
          &nbsp;
          <b-button variant="primary" type="button" :disabled="searching" @click="findMeetups">Find Meetups</b-button>
        </b-form>
      </b-col>
    </b-row>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <b-row>
      <b-col>
        <table class="table table-striped">
          <thead class="thead-dark">
          <tr>
            <th>Meetup Name</th>
            <th>Location</th>
            <th># Members</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="meetup in meetups" :key="meetup.id">
            <td><a :href="meetup.link" target="_blank">{{ meetup.name }}</a></td>
            <td>
              <a :href='"https://www.google.com/maps/?q=" + meetup.coords.lat + "," + meetup.coords.lon' target="_blank">
                {{ meetup.location }}
              </a>
            </td>
            <td>{{ meetup.members }} {{ meetup.who }}</td>
            <td>{{ Math.round(meetup.score/225*100) + " %" }}</td>
            <td>
              <ul class="list-inline">
                <li class="list-inline-item">
                  <b-btn :href="'https://www.meetup.com/' + meetup.urlname" target="_blank">
                    View
                  </b-btn>
                  <b-btn :href="'https://www.meetup.com/' + meetup.urlname + '/members/?op=leaders'" target="_blank">
                    Contact Organizers
                  </b-btn>
                  <router-link :to="'/meetups/applied/' + meetup.urlname">
                    <b-btn variant="success">
                      Applied
                    </b-btn>
                  </router-link>
                </li>
              </ul>
            </td>
          </tr>
          </tbody>
        </table>
      </b-col>
    </b-row>


  </div>
</template>

<script>
import places from "vue-places";
import AppNav from "./AppNav";
import { getMeetups } from "../utils/meetupfinder-api";

export default {
  components: { AppNav, places },
  name: "meetups-find",
  data() {
    return {
      city: "",
      latlng: {},
      searching: false,
      meetups: []
    };
  },
  methods: {
    changeLocation(query) {
      this.latlng = query.latlng;
    },
    findMeetups() {
      this.searching = true;
      getMeetups(this.latlng).then((meetups) => {
        this.searching = false;
        this.meetups = meetups;
      });
    }
  }
};
</script>

<style scoped>

</style>
