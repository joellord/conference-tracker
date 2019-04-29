<template>
  <div class="needinvite">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>You need an invite</h2>
    <hr width="80%" />
    <h4>Welcome to the conference tracker</h4>

    <b-row>
      <b-col>
        <p>We appreciate you wanting to know more about the evangelist team initiatives</p>
        <p>If you want access to this application, please request access by contacting the evangelism team</p>
        <p>In the Auth0 Slack, you can reach out to the #team-evangelist channel</p>
        <p>In the Ambassador Slack, you can reach out directly to any evangelist</p>
      </b-col>
    </b-row>

  </div>
</template>

<script>
import AppNav from "./AppNav";

export default {
  name: "submitted",
  components: { AppNav },
  data() {
    return {
    };
  },
  methods: {
  }
};
</script>

<style scoped>
  .row {
    margin-top: 3px;
  }
</style>
