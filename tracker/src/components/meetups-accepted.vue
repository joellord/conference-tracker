<template>
  <div class="meetups-accepted">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>💪 Congratulations ! 🤘</h2>
    <h3> You will present at {{ meetup.name }} </h3>

    <b-row>
      <b-col cols="6" offset="3">
        <b-form-group id="talk"
                      label="Which talk got accepted?"
                      label-for="talk">
          <b-form-select id="talk"
                         :options="talkOptions"
                         required
                         v-model="meetup.talkId">
          </b-form-select>
        </b-form-group>
        <b-form-group id="startDate" label="When are you presenting?" label-for="startDate" >
          <b-form-input id="startDate" type="date" v-model="meetup.startDate" />
        </b-form-group>
        <b-form-group id="attendee_goal" label="Expected Developers Reach:" label-for="attendee_goal" >
          <b-form-input id="attendee_goal" type="number" v-model="meetup.attendeeGoal" />
        </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col class="text-center">
        <b-btn class="btn btn-info" @click="saveAcceptance()">Save</b-btn>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import AppNav from "./AppNav";
import { getMeetup, getMyTalks, confirmMeetup } from "../utils/conf-api";

export default {
  name: "submitted",
  components: { AppNav },
  data() {
    return {
      talks: [],
      talkOptions: [],
      meetup: {}
    };
  },
  mounted() {
    this.getMeetup();
    this.getMyTalks();
  },
  methods: {
    getMyTalks() {
      getMyTalks().then((talks) => {
        this.talks = talks;
        this.talkOptions = talks.map(t => ({ value: t._id, text: t.title }));
      });
    },
    getMeetup() {
      getMeetup(this.$route.params.meetupId).then((meetup) => {
        this.meetup = meetup;
      });
    },
    saveAcceptance() {
      confirmMeetup(this.$route.params.meetupId, this.meetup).then(() => this.$router.push("/meetups"));
    }
  }
};
</script>

<style scoped>
  .row {
    margin-top: 3px;
  }
</style>
