<template>
  <div class="conferences">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Welcome to the great list of conferences</h2>

    <b-row>
      <b-col class="text-right">
        <conference-add-modal @conferenceAdded="getConferences()"></conference-add-modal>
      </b-col>
    </b-row>

    <b-row><b-col></b-col></b-row>

    <b-row>
      <b-col>
        <table class="table table-striped">
          <thead class="thead-dark">
            <tr>
              <th scope="col">Conference Name</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="conference in conferences" :key="conference.conferenceId">
              <td>
                <a :href="conference.url" target="_blank">{{ conference.name }}</a>
              </td>
              <td>
                <ul class="list-inline">
                  <li class="list-inline-item" v-if="conference.mySubmissions">
                    Submitted
                    <b-badge pill variant="light">{{ conference.mySubmissions }}</b-badge>
                  </li>
                  <li class="list-inline-item" v-if="conference.mySubmissions">
                    Approved
                  </li>
                  <li class="list-inline-item" v-if="conference.mySubmissions">
                    Rejected
                  </li>
                  <li class="list-inline-item" v-if="!conference.mySubmissions">
                    <router-link :to="'conferences/submitted/' + conference.conferenceId">
                      Submit
                    </router-link>
                    <span v-show="conference.cfpUrl && conference.cfpEnd > now">
                      (<a :href="conference.cfpUrl">CFP</a>)
                    </span>
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
import ConferenceAddModal from "./conference-add-modal";
import { getConferences } from "../utils/conf-api";

export default {
  components: { AppNav, ConferenceAddModal },
  name: "conferences",
  data() {
    return {
      conferences: [],
      now: (new Date()).getTime()
    };
  },
  mounted() {
    this.getConferences();
  },
  methods: {
    getConferences() {
      getConferences().then((conferences) => {
        this.conferences = conferences;
      });
    }
  }
};
</script>

<style scoped>

</style>
