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
import Meetups from "@/components/meetups";
import MeetupsFind from "@/components/meetups-find";
import MeetupsApplied from "@/components/meetups-applied";
import MeetupsAccepted from "@/components/meetups-accepted";
import MeetupDetails from "@/components/meetup-details";
import Profile from "@/components/profile";
import Reports from "@/components/reports";
import Report from "@/components/report";
import Stats from "@/components/stats";
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
      path: "/meetups",
      name: "Meetups",
      component: Meetups,
      beforeEnter: requireAuth
    },
    {
      path: "/meetups/find",
      name: "MeetupFind",
      component: MeetupsFind,
      beforeEnter: requireAuth
    },
    {
      path: "/meetups/applied/:urlname",
      name: "MeetupsApplied",
      component: MeetupsApplied,
      beforeEnter: requireAuth
    },
    {
      path: "/meetups/accepted/:meetupId",
      name: "MeetupsAccepted",
      component: MeetupsAccepted,
      beforeEnter: requireAuth
    },
    {
      path: "/meetup/:meetupId",
      name: "MeetupDetails",
      component: MeetupDetails,
      beforeEnter: requireAuth
    },
    {
      path: "/reports",
      name: "Reports",
      component: Reports,
      beforeEnter: requireAuth
    },
    {
      path: "/report/:type/:eventId?",
      name: "Report",
      component: Report,
      beforeEnter: requireAuth
    },
    {
      path: "/stats",
      name: "Stats",
      component: Stats,
      beforeEnter: requireAuth
    },
    {
      path: "/callback",
      component: Callback
    }
  ]
});
