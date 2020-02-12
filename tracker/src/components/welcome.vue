<template>
  <div>

    <b-jumbotron header="Welcome" lead="The Ultimate Conference Tracker">
      <p>Please login</p>
      <b-btn variant="primary" @click="handleLogin()">Login</b-btn>
    </b-jumbotron>
  </div>
</template>

<script>
import AppNav from "./AppNav";
import { isLoggedIn, login, renewToken } from "../utils/auth";

export default {
  components: { AppNav },
  name: "Welcome",
  methods: {
    handleLogin: login
  },
  beforeMount() {
    if (isLoggedIn()) {
      this.$router.push("/upcoming");
    } else {
      renewToken(() => {
        this.$router.push("/upcoming");
      });
    }
  }
};
</script>

<style scoped>

</style>
