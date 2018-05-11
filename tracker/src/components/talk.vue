<template>
  <div class="talk">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>{{ talk.title }} <span class="copyBtn" v-clipboard:copy="talk.title">📋</span></h2>

    <b-row><b-col></b-col></b-row>

    <b-row><b-col class="text-right">
      <b-btn class="btn btn-primary" @click="switchToEditMode" v-if="!editMode">Edit</b-btn>
      <b-btn class="btn btn-success" @click="saveChanges" v-if="editMode">Save</b-btn>
      <b-btn class="btn btn-danger" @click="cancelChanges" v-if="editMode">Cancel</b-btn>
    </b-col></b-row>

    <div v-if="editMode" class="talkForm">
      <b-row>
        <b-col>
          <b-form>
            <b-form-group id="title" label="Talk Title:" label-for="title" >
              <b-form-input id="title" type="text" v-model="talk.title" />
            </b-form-group>
            <b-form-group id="abstract" label="Abstract:" label-for="abstract" >
              <b-form-textarea id="abstract" v-model="talk.abstract" :rows="6" ></b-form-textarea>
            </b-form-group>
            <b-form-group id="notes" label="Notes:" label-for="notes" >
              <b-form-textarea id="notes" v-model="talk.notes" :rows="6" ></b-form-textarea>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
    </div>

    <div v-if="!editMode" class="talkData">
      <b-row>
        <b-col>
          <span class="label">Abstract</span>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="11">
          <p>{{ talk.abstract }}</p>
        </b-col>
        <b-col>
          <span class="copyBtn" v-clipboard:copy="talk.abstract">📋</span>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <span class="label">Notes</span>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="11">
          <p>{{ talk.notes || "N/A" }}</p>
        </b-col>
        <b-col>
          <span class="copyBtn" v-clipboard:copy="talk.notes">📋</span>
        </b-col>
      </b-row>
    </div>

  </div>
</template>

<script>
import Button from "bootstrap-vue/es/components/button/button";
import AppNav from "./AppNav";
import { getTalkById, updateTalk } from "../utils/conf-api";

export default {
  components: {
    Button,
    AppNav },
  name: "Talk",
  data() {
    return {
      talk: {},
      editMode: false
    };
  },
  mounted() {
    this.getTalk();
  },
  methods: {
    saveChanges() {
      updateTalk(this.$route.params.talkId, this.talk).then(() => {
        this.editMode = false;
      });
    },
    cancelChanges() {
      this.getTalk();
      this.editMode = false;
    },
    switchToEditMode() {
      this.editMode = true;
    },
    getTalk() {
      getTalkById(this.$route.params.talkId).then((talk) => {
        this.talk = talk;
      });
    }
  }
};
</script>

<style scoped>
.label {
  font-weight: bold;
}

.talkForm, .talkData {
  text-align: left;
}

.copyBtn {
  cursor: pointer;
  font-size: 16px;
}
</style>
