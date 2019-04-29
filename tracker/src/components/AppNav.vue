<template>
  <b-navbar toggleable="md" type="dark" variant="info">

    <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

    <b-navbar-brand href="#">ConfTracker</b-navbar-brand>

    <b-collapse is-nav id="nav_collapse">

      <b-navbar-nav>
        <b-nav-item v-if="permissions.showConferenceLink" to="/conferences">Conferences</b-nav-item>
        <b-nav-item v-if="permissions.showMeetupLink"  to="/meetups">Meetups</b-nav-item>
        <b-nav-item v-if="permissions.showUpcomingLink"  to="/upcoming">Upcoming</b-nav-item>
        <b-nav-item v-if="permissions.showTalkLink"  to="/talks">My Talks</b-nav-item>
        <b-nav-item v-if="permissions.showReportLink"  to="/reports">
          Post-Event Reports
          <b-badge pill variant="warning" v-if="notifications.reports > 0">{{ notifications.reports }}</b-badge>
        </b-nav-item>
        <b-nav-item v-if="permissions.showStatLink"  to="/stats">Stats</b-nav-item>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">

        <b-nav-item-dropdown right>
          <!-- Using button-content slot -->
          <template slot="button-content">
            <img :src="getUserImage" class="profile-pic"/>
          </template>
          <b-dropdown-item v-if="permissions.showProfileLink"  to="/profile">
            Profile
          </b-dropdown-item>
          <b-dropdown-item href="#" @click="handleLogout()">Logout</b-dropdown-item>
        </b-nav-item-dropdown>

      </b-navbar-nav>

    </b-collapse>
  </b-navbar>

</template>

<script>
import { isLoggedIn, getUserImage, login, logout } from "../utils/auth";
import { getNavbarPermissions } from "../utils/acl";
import { getNotifications } from "../utils/conf-api";

export default {
  name: "app-nav",
  mounted() {
    getNotifications().then((notifications) => {
      this.notifications = notifications;
    });
  },
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
  },
  data() {
    return {
      permissions: getNavbarPermissions(),
      getUserImage: getUserImage(),
      notifications: { reports: 0 }
    };
  }
};
</script>

<style scoped>
.navbar-brand {
  font-weight: bold;
}
.profile-pic {
  height: 40px;
  border-radius: 20px;
}
</style>
