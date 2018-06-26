<template>
  <div class="approved">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>🎉 Congratulations ! 🎉</h2>
    <h3> You have been accepted to {{ conference.name }} </h3>

    <b-row>
      <b-col cols="6" offset="3">
        <p>Select the talk(s) that have been accepted.</p>
        <p>All other talks will be marked as rejected.</p>
      </b-col>
    </b-row>

    <b-row v-for="talk in talks" :key="talk.id">
      <b-col cols="6" offset="3">
        <b-input-group>
          <b-input-group-prepend is-text>
            <input type="checkbox" aria-label="Checkbox if approved" :id="'talk-' + talk.id" v-model="talk.approved">
          </b-input-group-prepend>
          <b-form-input type="text" aria-label="Title of talk" readonly :value="talk.title"/>
        </b-input-group>
      </b-col>
    </b-row>

    <h3>Please also fill in the following information for our SLKs</h3>

    <b-row>
      <b-col cols="6" offset="3">
        <b-form-group id="overview" label="Overview:" label-for="overview" >
          <b-form-textarea id="overview" v-model="conference.overview" :rows="6" ></b-form-textarea>
        </b-form-group>
        <b-form-group id="attendee_goal" label="Expected Developers Reach:" label-for="attendee_goal" >
          <b-form-input id="attendee_goal" type="number" v-model="conference.attendeeGoal" />
        </b-form-group>
        <b-form-group id="relationship_goal" label="Expected New Relationships:" label-for="relationship_goal" >
        <b-form-input id="relationship_goal" type="number" v-model="conference.relationshipGoal" />
      </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col class="text-center">
        <b-btn class="btn btn-info" @click="saveApprovals()">Save</b-btn>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import AppNav from "./AppNav";
import { getMySubmissions, getConference, addApprovals, updateConference } from "../utils/conf-api";

export default {
  name: "submitted",
  components: { AppNav },
  data() {
    return {
      talks: [],
      conference: {}
    };
  },
  mounted() {
    this.getMySubmittedTalks();
    this.getConferenceDetails();
  },
  methods: {
    getMySubmittedTalks() {
      getMySubmissions(this.$route.params.conferenceId).then((talks) => {
        this.talks = talks;
      });
    },
    getConferenceDetails() {
      getConference(this.$route.params.conferenceId).then((conf) => {
        this.conference = conf;
      });
    },
    saveApprovals() {
      const approvals = this.talks.filter(talk => talk.approved).map(approval => approval._id);
      updateConference(this.$route.params.conferenceId, this.conference).then(() => {
        const result = addApprovals(this.$route.params.conferenceId, approvals);
        return result;
      }).then(() => this.$router.push("/conferences"));
    }
  }
};
</script>

<style scoped>
  .row {
    margin-top: 3px;
  }
</style>
