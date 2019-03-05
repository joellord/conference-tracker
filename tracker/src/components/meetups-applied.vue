<template>
  <div class="meetups-applied">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Applied to Meetup</h2>
    <h4>Congratulations!  Please fill in the details for this meetup</h4>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <b-row>
      <b-col cols="8" offset="2">
        {{ meetup.name }}
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="8" offset="2">
        {{ meetup.localized_location }}
      </b-col>
    </b-row>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <b-row>
      <b-col cols="8" offset="2" class="text-left">
        Suggested dates:
        <b-form inline>
          <b-form-group class="text-center">
            Between
            <b-form-input id="suggestedDateStart"
                          type="date"
                          required
                          placeholder="from"
                          v-model="start"
                          @change="startDateChanged">
            </b-form-input>
            And
            <b-form-input id="suggestedDateEnd"
                          type="date"
                          required
                          placeholder="to"
                          v-model="end">
            </b-form-input>
          </b-form-group>
        </b-form>
        <b-form>
          <b-form-group>
            <b-button type="button" variant="primary" @click="saveMeetup">Save</b-button>
          </b-form-group>
        </b-form>
      </b-col>
    </b-row>

  </div>
</template>

<script>
import AppNav from "./AppNav";
import { getMeetup } from "../utils/meetupfinder-api";
import { applyMeetup } from "../utils/conf-api";

export default {
  components: { AppNav },
  name: "meetups-applied",
  data() {
    return {
      start: "",
      end: "",
      meetup: {}
    };
  },
  mounted() {
    this.getMeetup();
  },
  methods: {
    startDateChanged(start) {
      if (!this.end) this.end = start;
    },
    getMeetup() {
      getMeetup(this.$route.params.urlname).then((meetup) => {
        this.meetup = meetup;
      });
    },
    saveMeetup() {
      applyMeetup(this.meetup, this.start, this.end).then(() => this.$router.push("/meetups"));
    }
  }
};
</script>

<style scoped>

</style>
