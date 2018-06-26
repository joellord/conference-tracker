import Vue from "vue";
import Router from "vue-router";
import Welcome from "@/components/welcome";
import Conferences from "@/components/conferences";
import ConferenceDetails from "@/components/conference-details";
import Upcoming from "@/components/upcoming";
import Talks from "@/components/talks";
import Callback from "@/components/callback";
import Submitted from "@/components/submitted";
import Approved from "@/components/approved";
import Talk from "@/components/talk";
import Profile from "@/components/profile";
import { requireAuth } from "../utils/auth";

Vue.use(Router);

export default new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      name: "Welcome",
      component: Welcome
    },
    {
      path: "/conferences",
      name: "Conferences",
      component: Conferences,
      beforeEnter: requireAuth
    },
    {
      path: "/conference/:conferenceId",
      name: "ConferenceDetails",
      component: ConferenceDetails,
      beforeEnter: requireAuth
    },
    {
      path: "/conferences/submitted/:conferenceId",
      name: "Submitted",
      component: Submitted,
      beforeEnter: requireAuth
    },
    {
      path: "/conferences/approved/:conferenceId",
      name: "Approved",
      component: Approved,
      beforeEnter: requireAuth
    },
    {
      path: "/upcoming",
      name: "Upcoming",
      component: Upcoming,
      beforeEnter: requireAuth
    },
    {
      path: "/talks",
      name: "Talks",
      component: Talks,
      beforeEnter: requireAuth
    },
    {
      path: "/talk/:talkId",
      name: "Talk",
      component: Talk,
      beforeEnter: requireAuth
    },
    {
      path: "/profile",
      name: "Profile",
      component: Profile,
      beforeEnter: requireAuth
    },
    {
      path: "/callback",
      component: Callback
    }
  ]
});
