<template>
  <div class="dashboard">
    <app-nav></app-nav>
    <h1>Dashboard</h1>
    <h2>Welcome to your dashboard</h2>
    <p>There are {{ conferences.length }} conferences in the DB</p>
  </div>
</template>

<script>
import AppNav from "./AppNav";
import { getConferences } from "../utils/conf-api";

export default {
  components: { AppNav },
  name: "dashboard",
  data() {
    return {
      conferences: []
    };
  },
  mounted() {
    this.getConferences();
  },
  methods: {
    getConferences() {
      getConferences().then((conferences) => {
        this.conferences = conferences;
      });
    }
  }
};
</script>

<style scoped>

</style>
