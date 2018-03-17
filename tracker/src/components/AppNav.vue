<template>
  <b-navbar toggleable="md" type="dark" variant="info">

    <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

    <b-navbar-brand href="#">ConfTracker</b-navbar-brand>

    <b-collapse is-nav id="nav_collapse">

      <b-navbar-nav>
        <b-nav-item to="/conferences">Conferences</b-nav-item>
        <b-nav-item to="/talks">My Talks</b-nav-item>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">

        <b-nav-form>
          <b-button size="sm" class="my-2 my-sm-0" type="button" @click="handleLogout()">Logout</b-button>
        </b-nav-form>

      </b-navbar-nav>

    </b-collapse>
  </b-navbar>

</template>

<script>
import { isLoggedIn, login, logout } from "../utils/auth";

export default {
  name: "app-nav",
  methods: {
    handleLogin() {
      login();
    },
    handleLogout() {
      logout();
    },
    isLoggedIn() {
      return isLoggedIn();
    }
  }
};
</script>

<style scoped>
.navbar-brand {
  font-weight: bold;
}
</style>
