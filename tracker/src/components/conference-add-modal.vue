<template>
  <span class="text-left">
    <b-btn class="btn btn-success" v-b-modal.conferenceAddModal>+ Add</b-btn>

    <b-modal size="lg" id="conferenceAddModal" title="Add Conference" @ok="handleOk" @show="onShown" ref="modal">
      <b-form>
        <b-row>
          <b-col cols="6">
            <b-form-group label="Conference Name" label-for="name">
              <b-form-input id="name" type="text" required placeholder="Conference X" v-model="conference.name"></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="6">
            <b-form-group label="Website" label-for="url">
              <b-form-input id="url" type="text" required placeholder="https://www.example.com" v-model="conference.url"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6">
            <b-form-group label="Start Date" label-for="startDate">
              <b-form-input id="startDate" type="date" required placeholder="MM-DD-YYYY" v-model="conference.startDate"></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="6">
            <b-form-group label="End Date" label-for="endDate">
              <b-form-input id="endDate" type="date" required placeholder="MM-DD-YYYY" v-model="conference.endDate"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6">
            <b-form-group label="CFP URL" label-for="cfpUrl">
              <b-form-input id="cfpUrl" type="text" required placeholder="https://www.example.com" v-model="conference.cfpUrl"></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="6">
            <b-form-group label="CFP Close Date" label-for="cfpDate">
              <b-form-input id="cfpDate" type="date" required placeholder="MM-DD-YYYY" v-model="conference.cfpDate"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6">
            <b-form-group label="City" label-for="city">
              <b-form-input id="city" type="text" required placeholder="Ottawa" v-model="conference.city"></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="6">
            <b-form-group label="State/Province" label-for="state">
              <b-form-input id="state" type="text" required placeholder="ON" v-model="conference.state"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6">
            <b-form-group label="Country" label-for="country">
              <b-form-input id="country" type="text" required placeholder="Canada" v-model="conference.country"></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="6">
            <b-form-group label="Region" label-for="region">
              <b-form-select id="region" v-model="conference.regionId" :options="regions" class="mb-3" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6">
            <b-form-group label="Twitter" label-for="twitter">
              <b-form-input id="twitter" type="text" required placeholder="@twitter" v-model="conference.twitter"></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="6">

          </b-col>
        </b-row>
      </b-form>
    </b-modal>
  </span>
</template>

<script>
import { addConference, getRegions } from "../utils/conf-api";

export default {
  name: "conference-add-modal",
  data() {
    return {
      conference: {
        name: "",
        url: "",
        startDate: "",
        endDate: "",
        cfpUrl: "",
        cfpDate: "",
        city: "",
        state: "",
        country: "",
        twitter: "",
        regionId: 1
      },
      regions: []
    };
  },
  mounted() {
    getRegions().then((regions) => {
      regions.map(r => this.regions.push({ value: r.id, text: r.region }));
    });
  },
  methods: {
    handleOk() {
      const formattedConference = Object.assign({}, this.conference);
      formattedConference.startDate = new Date(this.conference.startDate).getTime();
      formattedConference.endDate = new Date(this.conference.endDate).getTime();
      formattedConference.cfpDate = new Date(this.conference.cfpDate).getTime();
      addConference(formattedConference);
      this.$emit("conferenceAdded", {});
    },
    onShown() {
      this.conference.name = "";
      this.conference.url = "";
      this.conference.startDate = "";
      this.conference.endDate = "";
      this.conference.cfpUrl = "";
      this.conference.cfpDate = "";
      this.conference.city = "";
      this.conference.state = "";
      this.conference.country = "";
      this.conference.twitter = "";
    },
    handleSubmit() {
      // this.$refs.modal.hide();
    }
  }
};
</script>

<style scoped>

</style>
