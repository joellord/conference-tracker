<template>
<div class="conference-details">
  <app-nav></app-nav>

  <b-row><b-col>&nbsp;</b-col></b-row>

  <h2>{{ conference.name }}</h2>

  <b-row><b-col></b-col></b-row>

  <b-row>
    <b-col>
      This event will be held in {{ conference.city }} from {{ dateFormat(conference.startDate) }}
      to {{ dateFormat(conference.endDate) }}.
    </b-col>
  </b-row>
  <b-row><b-col><br/></b-col></b-row>
  <b-row>
    <b-col>
      <h4>Submissions</h4>
    </b-col>
  </b-row>
  <b-row>
    <b-col>
      <table class="table table-striped">
        <thead class="thead-dark">
        <tr>
          <th scope="col">Talk</th>
          <th scope="col">Presenter</th>
          <th scope="col">Status</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="submission in conference.submissions" :key="submission._id">
          <td>{{ submission.talk.title }}</td>
          <td>{{ submission.user.name }}</td>
          <td>
            <span v-if="submission.status === 'APPROVED'">👍</span>
            <span v-if="submission.status === 'REJECTED'">👎</span>
            <span v-if="submission.status === 'NULL'">❓</span>
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
import { getConference } from "../utils/conf-api";
import { dateFormat } from "../utils/helpers";

export default {
  components: { AppNav },
  name: "conferenceDetails",
  data() {
    return {
      conference: {}
    };
  },
  mounted() {
    this.getConference();
  },
  methods: {
    dateFormat(d) {
      return dateFormat(d);
    },
    getConference() {
      getConference(this.$route.params.conferenceId).then((conference) => {
        this.conference = conference;
      });
    }
  }
};
</script>

<style scoped>

</style>
