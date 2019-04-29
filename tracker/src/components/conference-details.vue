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
  <b-row>
    <b-col>
      Expenses Covered?
    </b-col>
  </b-row>
  <b-row>
    <b-col cols="2" offset="4">
      ✈️ {{ expensesCovered(conference.travelCovered) }}
    </b-col>
    <b-col cols="2">
      🏨 {{ expensesCovered(conference.lodgingCovered) }}
    </b-col>
  </b-row>
  <b-row><b-col><br/></b-col></b-row>
  <b-row v-if="canSeeList">
    <b-col>
      <h4>Submissions</h4>
    </b-col>
  </b-row>
  <b-row v-if="canSeeList">
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
import { dateFormat, expensesCovered } from "../utils/helpers";
import { isPermissionEnabled, PERMISSIONS } from "../utils/acl";

export default {
  components: { AppNav },
  name: "conferenceDetails",
  data() {
    return {
      conference: {},
      canSeeList: isPermissionEnabled(PERMISSIONS.CONFERENCE.SUBMISSIONS)
    };
  },
  mounted() {
    this.getConference();
  },
  methods: {
    dateFormat(d) {
      return dateFormat(d);
    },
    expensesCovered(val) {
      return expensesCovered(val);
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
