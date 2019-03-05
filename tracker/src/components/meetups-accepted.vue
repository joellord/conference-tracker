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
        <b-form-group id="StartDate" label="When are you presenting?" label-for="startDate" >
          <b-form-input id="startDate" type="date" required placeholder="MM-DD-YYYY" v-model="meetup.startDate"></b-form-input>
        </b-form-group>
        <b-form-group label="Region" label-for="region">
          <b-form-select id="region" v-model="meetup.regionId" :options="regions" />
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
import { getMeetup, getMyTalks, confirmMeetup, getRegions } from "../utils/conf-api";

export default {
  name: "submitted",
  components: { AppNav },
  data() {
    return {
      talks: [],
      talkOptions: [],
      meetup: {
        talkId: "",
        startDate: "",
        regionId: "",
        attendeeGoal: ""
      },
      regions: []
    };
  },
  mounted() {
    this.getMeetup();
    this.getMyTalks();
    getRegions().then((regions) => {
      regions.map(r => this.regions.push({ value: r.id, text: r.region }));
      this.meetup.regionId = 1;
    });
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
      let formattedMeetup = Object.assign({}, this.meetup);
      formattedMeetup.startDate = new Date(formattedMeetup.startDate).getTime();
      confirmMeetup(this.$route.params.meetupId, formattedMeetup).then(() => this.$router.push("/meetups"));
    }
  }
};
</script>

<style scoped>
  .row {
    margin-top: 3px;
  }
</style>
