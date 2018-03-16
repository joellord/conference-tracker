<template>
  <div class="">
    <app-nav></app-nav>
    <h1>Welcome to the conference tracker</h1>

    <h2>Please login with your @auth0.com email account</h2>
  </div>
</template>

<script>
import AppNav from "./AppNav";

export default {
  components: { AppNav },
  name: "Welcome"
};
</script>

<style scoped>

</style>
