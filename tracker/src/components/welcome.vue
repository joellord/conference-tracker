<template>
  <div>

    <b-jumbotron header="Welcome" lead="The Ultimate Conference Tracker">
      <p>Please login with your @auth0.com email account</p>
      <b-btn variant="primary" @click="handleLogin()">Login</b-btn>
    </b-jumbotron>
  </div>
</template>

<script>
import AppNav from "./AppNav";
import { isLoggedIn, login } from "../utils/auth";

export default {
  components: { AppNav },
  name: "Welcome",
  methods: {
    handleLogin: login
  },
  mounted() {
    if (isLoggedIn()) {
      this.$router.push("/conferences");
    }
  }
};
</script>

<style scoped>

</style>
