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
              <th scope="col">Submitted<br/>Approved<br/>Rejected</th>
              <th scope="col">Status</th>
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
                <b-badge pill variant="light">{{ conference.mySubmissions }}</b-badge>
                <b-badge pill variant="success">{{ conference.myApproved }}</b-badge>
                <b-badge pill variant="danger">{{ conference.myRejected }}</b-badge>
              </td>
              <td>
                <span v-if="!conference.mySubmissions && !conference.myApproved && !conference.myRejected">N/A</span>
                <span v-if="conference.mySubmissions > 0">Submitted</span>
                <span v-if="conference.myApproved">Approved</span>
                <span v-if="!conference.myApproved && conference.myRejected">Rejected</span>
              </td>
              <td>
                <ul class="list-inline">
                  <li class="list-inline-item" v-if="conference.myApproved">
                    👍 (details)
                  </li>
                  <li class="list-inline-item" v-if="conference.mySubmissions">
                    <router-link :to="'conferences/approved/' + conference._id">
                      <b-btn variant="sm" class="btn-success">Approved</b-btn>
                    </router-link>
                    <b-btn variant="sm" class="btn-danger" @click="rejectConference(conference._id)">Rejected</b-btn>
                  </li>
                  <li class="list-inline-item" v-if="!conference.mySubmissions && !conference.myApproved && !conference.myRejected">
                    <router-link :to="'conferences/submitted/' + conference._id">
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
import { getConferences, rejectConference } from "../utils/conf-api";

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
    },
    rejectConference(id) {
      rejectConference(id).then(this.getConferences);
    }
  }
};
</script>

<style scoped>

</style>
