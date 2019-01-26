<template>
  <div class="conferences">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Upcoming Events</h2>

    <b-row><b-col></b-col></b-row>

    <b-row>
      <b-col>
        <table class="table table-striped">
          <thead class="thead-dark">
            <tr>
              <th scope="col">Event Name</th>
              <th scope="col">Type</th>
              <th scope="col">Dates</th>
              <th scope="col">Speakers</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="conference in conferences" :key="conference.type.substring(0,1) + conference._id">
              <td>
                <router-link v-if="conference.type=='CONFERENCE'" :to="'conference/' + conference._id">{{ conference.name }}</router-link>
                <router-link v-if="conference.type=='MEETUP'" :to="'meetup/' + conference._id">{{ conference.name }}</router-link>
                <a :href="conference.url" target="_blank">🔗</a>
              </td>
              <td>
                <b-badge pill variant="success" v-if="conference.type=='CONFERENCE'">Conference</b-badge>
                <b-badge pill variant="danger" v-if="conference.type=='MEETUP'">Meetup</b-badge>
              </td>
              <td>
                {{ dateFormat(conference.startDate) }}
                <span v-if="conference.endDate && conference.startDate != conference.endDate"> to {{ dateFormat(conference.endDate) }}</span>
              </td>
              <td>
                {{ conference.speakers }}
              </td>
              <td>
                <ul class="list-inline">
                  <li class="list-inline-item" v-if="conference.type == 'CONFERENCE'">
                    <a :href="conference.slkLink" target="_blank">SLK</a>
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
import { getUpcomingConferences } from "../utils/conf-api";
import { dateFormat } from "../utils/helpers";

export default {
  components: { AppNav },
  name: "upcoming",
  data() {
    return {
      conferences: [],
      now: (new Date()).getTime()
    };
  },
  mounted() {
    this.getUpcoming();
  },
  methods: {
    dateFormat(d) {
      return dateFormat(d);
    },
    getUpcoming() {
      getUpcomingConferences().then((conferences) => {
        this.conferences = conferences;
      });
    }
  }
};
</script>

<style scoped>

</style>
