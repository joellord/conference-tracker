<template>
  <div class="profile">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Profile</h2>

    <b-row><b-col></b-col></b-row>

    <b-row><b-col class="text-right">
      <b-btn class="btn btn-primary" @click="switchToEditMode" v-if="!editMode">Edit</b-btn>
      <b-btn class="btn btn-success" @click="saveChanges" v-if="editMode">Save</b-btn>
      <b-btn class="btn btn-danger" @click="cancelChanges" v-if="editMode">Cancel</b-btn>
    </b-col></b-row>

    <div v-if="editMode" class="profileForm">
      <b-row>
        <b-col>
          <b-form>
            <b-form-group id="bio" label="Bio:" label-for="bio" >
              <b-form-textarea id="bio" v-model="bio" :rows="6" ></b-form-textarea>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-form>
            <label for="communityUsername">Auth0 Community Username:</label>
            <b-form-input
              id="communityUsername"
              v-model="communityUsername"
              :formatter="communityUsernameFormatter"
              placeholder="@username"
              name="communityUsername"
              aria-describedby="communityUsernameFormatterHelp"
            ></b-form-input>
            <b-form-text id="communityUsernameFormatterHelp">
              Enter you Auth0 Community (<a href="https://commuity.auth0.com">https://community.auth0.com</a>)
              username including the "@"
            </b-form-text>
          </b-form>
        </b-col>
      </b-row>
    </div>

    <div v-if="!editMode" class="profileData">
      <b-row>
        <b-col>
          <span class="label">Bio</span>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="11">
          <p>{{ bio }}</p>
        </b-col>
        <b-col>
          <span class="copyBtn" v-clipboard:copy="bio">📋</span>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <span class="label">Auth0 Community Username</span>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <p>{{ communityUsername }}</p>
        </b-col>
      </b-row>
    </div>

  </div>
</template>

<script>
import AppNav from "./AppNav";
import { getLocalUser, saveLocalUser } from "../utils/conf-api";

export default {
  components: {
    AppNav
  },
  name: "Profile",
  data() {
    return {
      bio: "",
      communityUsername: "",
      editMode: false
    };
  },
  mounted() {
    this.getProfile();
  },
  methods: {
    saveChanges() {
      saveLocalUser({ bio: this.bio, communityUsername: this.communityUsername }).then(() => {
        this.editMode = false;
      });
    },
    cancelChanges() {
      this.getProfile();
      this.editMode = false;
    },
    switchToEditMode() {
      this.editMode = true;
    },
    getProfile() {
      getLocalUser().then((profile) => {
        this.bio = profile.bio;
        this.communityUsername = profile.communityUsername;
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
