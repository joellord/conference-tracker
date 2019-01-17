<template>
  <div class="meetups">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Welcome to the great list of Meetups</h2>
    <h5>List of Meetups <em>I</em> applied to</h5>

    <b-row>
      <b-col class="text-right">
        <router-link to="/meetups/find">
          <b-btn class="btn btn-info">Find Meetups</b-btn>
        </router-link>
      </b-col>
    </b-row>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <b-row>
      <b-col>
        <table class="table table-striped">
          <thead class="thead-dark">
            <tr>
              <th scope="col">Meetup Name</th>
              <th scope="col">Status</th>
              <th scope="col">Who</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="meetup in meetups" :key="meetup._id">
              <td>
                <a :href="meetup.url" target="_blank">{{ meetup.name }}</a>
              </td>
              <td>
                Applied for a presentation between {{ dateFormat(meetup.suggestedDateStart) }} and {{ dateFormat(meetup.suggestedDateEnd) }}
              </td>
              <td>
                {{ meetup.userId.name }}
              </td>
              <td>
                <ul class="list-inline">
                  <li class="list-inline-item" v-if="meetup.status === 'APPLIED'">
                    <b-btn variant="sm" class="btn-success" :to="`/meetups/accepted/${meetup._id}`">Accepted</b-btn>
                    <b-btn variant="sm" class="btn-danger" @click="rejectMeetup(meetup._id)">Rejected</b-btn>
                    <b-btn variant="sm" class="btn-light" @click="dropMeetup(meetup._id)">Fuck it</b-btn>
                  </li>
                  <li class="list-inline-item" v-if="meetup.status === 'CONFIRMED'">
                    Accepted
                    <router-link :to="'meetup/' + meetup._id">View details</router-link>
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
import AppNav from "./AppNav";
import { getMeetups, droppedMeetup, rejectedMeetup } from "../utils/conf-api";
import { dateFormat } from "../utils/helpers";

export default {
  components: { AppNav },
  name: "meetups",
  data() {
    return {
      meetups: []
    };
  },
  mounted() {
    this.getMeetups();
  },
  methods: {
    dateFormat(d) {
      return dateFormat(d);
    },
    getMeetups() {
      getMeetups().then((meetups) => {
        this.meetups = meetups;
      });
    },
    dropMeetup(id) {
      droppedMeetup(id).then(() => {
        this.getMeetups();
      });
    },
    rejectMeetup(id) {
      rejectedMeetup(id).then(() => {
        this.getMeetups();
      });
    }
  }
};
</script>

<style scoped>

</style>
