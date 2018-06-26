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
              <th scope="col">Conference Name</th>
              <th scope="col">Dates</th>
              <th scope="col">Speakers</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="conference in conferences" :key="conference._id">
              <td>
                <router-link :to="'conference/' + conference._id">{{ conference.name }}</router-link>
                <a :href="conference.url" target="_blank">🔗</a>
              </td>
              <td>
                {{ new Date(conference.startDate).toLocaleDateString() }}
                <span v-if="conference.endDate"> to {{ new Date(conference.endDate).toLocaleDateString() }}</span>
              </td>
              <td>
                {{ conference.speakers }}
              </td>
              <td>
                <ul class="list-inline">
                  <li class="list-inline-item">
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
