<template>
  <div class="report">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Post-Event Report<span v-if="event.name"> for {{ event.name }}</span></h2>

    <h3>Please fill in the following information</h3>

    <b-row>
      <b-col cols="6" offset="3">
        <b-form-group horizontal id="name" label="Event Name" label-for="name" v-if="this.$route.params.type == 'other'">
          <b-form-input id="name" type="text" v-model="report.eventName" />
        </b-form-group>
        <b-form-group horizontal id="eventDate" label="Event Date" label-for="eventDate" v-if="this.$route.params.type == 'other'">
          <b-form-input id="eventDate" type="date" v-model="report.eventDate" />
        </b-form-group>
        <b-form-group horizontal id="attendees_reached" label="Developers Reached" label-for="attendees_reached" >
          <b-form-input id="attendees_reached" type="number" v-model="report.developersReached" />
        </b-form-group>
        <b-form-group horizontal id="relationship_reached" label="New Relationships" label-for="relationship_reached"
                      v-if="this.$route.params.type != 'other'">
          <b-form-input id="relationship_reached" type="number" v-model="report.relations" />
        </b-form-group>
        <b-form-group horizontal label="Region" label-for="region" v-if="this.$route.params.type == 'other'">
          <b-form-select id="region" v-model="report.regionId" :options="regions" />
        </b-form-group>
        <b-form-group horizontal label="Source" label-for="source">
          <b-form-select id="source" v-model="report.sourceId" :options="sources" />
        </b-form-group>
        <b-form-group horizontal label="Type" label-for="type" v-if="this.$route.params.type == 'other'">
          <b-form-select id="type" v-model="report.typeId" :options="types" />
        </b-form-group>
        <b-form-group horizontal id="overview" label="General Impression (would you go back next year?)" label-for="overview"
                      v-if="this.$route.params.type != 'other'">
          <b-form-textarea id="overview" v-model="report.impressions" :rows="6" ></b-form-textarea>
        </b-form-group>
        <b-form-group horizontal id="notes" label="Other Notes (followups to do, people you met, ...)" label-for="notes" >
          <b-form-textarea id="notes" v-model="report.notes" :rows="6" ></b-form-textarea>
        </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col class="text-center">
        <b-btn class="btn btn-info" @click="saveReport()">Save</b-btn>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import AppNav from "./AppNav";
import { getEventDetails, createReport, getRegions, getEventTypes, getEventSources } from "../utils/conf-api";

export default {
  name: "report",
  components: { AppNav },
  data() {
    return {
      event: { name: "" },
      report: {},
      regions: [],
      sources: [],
      types: []
    };
  },
  mounted() {
    this.getEventDetails();
    getRegions().then((regions) => {
      regions.map(r => this.regions.push({ value: r.id, text: r.region }));
      this.report.regionId = 1;
    });
    getEventSources().then((sources) => {
      sources.map(s => this.sources.push({ value: s.id, text: s.source }));
      this.report.sourceId = 1;
    });
    getEventTypes().then((types) => {
      types.map(t => this.types.push({ value: t.id, text: t.type }));
      this.report.typeId = 1;
    });
  },
  methods: {
    getEventDetails() {
      if (this.$route.params.eventId) {
        getEventDetails(this.$route.params.type, this.$route.params.eventId).then((event) => {
          this.event = event;
          this.report.eventName = event.name;
          this.report.regionId = event.regionId;
          this.report.developersReached = event.attendeeGoal;
          this.report.relations = event.relationshipGoal;
          this.report.eventDate = event.startDate;
        });
      }
    },
    saveReport() {
      const report = this.report;
      if (this.$route.params.type === "conference") {
        report.conferenceId = this.$route.params.eventId;
        report.typeId = 1;
      }
      if (this.$route.params.type === "meetup") {
        report.meetupId = this.$route.params.eventId;
        report.typeId = 2;
      }
      if (this.$route.params.type === "other") {
        report.eventDate = (new Date()).getTime();
      }

      createReport(report).then(() => this.$router.push("/reports"));
    }
  }
};
</script>

<style scoped>

</style>
