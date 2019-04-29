import Vue from "vue";
import Router from "vue-router";
import Welcome from "@/components/welcome";
import NeedInvite from "@/components/need-invite";
import Unauthorized from "@/components/unauthorized";
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

import { isLoggedIn } from "../utils/auth";
import { isGuest, isPermissionEnabled, PERMISSIONS } from "../utils/acl";

Vue.use(Router);

function requireAuth(to, from, next) {
  if (!isLoggedIn()) {
    return next({
      path: "/"
    });
  }

  if (isGuest()) {
    return next({
      path: "/needinvite"
    });
  }

  if (to.meta.requiredPermission && !isPermissionEnabled(to.meta.requiredPermission)) {
    return next({
      path: "/unauthorized"
    });
  }

  return next();
}

export default new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      name: "Welcome",
      component: Welcome
    },
    {
      path: "/needinvite",
      name: "NeedInvite",
      component: NeedInvite
    },
    {
      path: "/unauthorized",
      name: "Unauthorized",
      component: Unauthorized
    },
    {
      path: "/conferences",
      name: "Conferences",
      component: Conferences,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.CONFERENCE.LIST
      }
    },
    {
      path: "/conference/:conferenceId",
      name: "ConferenceDetails",
      component: ConferenceDetails,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.CONFERENCE.DETAILS
      }
    },
    {
      path: "/conferences/submitted/:conferenceId",
      name: "Submitted",
      component: Submitted,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.CONFERENCE.SUBMIT
      }
    },
    {
      path: "/conferences/approved/:conferenceId",
      name: "Approved",
      component: Approved,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.CONFERENCE.SUBMIT
      }
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
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.TALK.LIST
      }
    },
    {
      path: "/talk/:talkId",
      name: "Talk",
      component: Talk,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.TALK.LIST
      }
    },
    {
      path: "/profile",
      name: "Profile",
      component: Profile,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.PROFILE.ALL
      }
    },
    {
      path: "/meetups",
      name: "Meetups",
      component: Meetups,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.MEETUP.LIST
      }
    },
    {
      path: "/meetups/find",
      name: "MeetupFind",
      component: MeetupsFind,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.MEETUP.FIND
      }
    },
    {
      path: "/meetups/applied/:urlname",
      name: "MeetupsApplied",
      component: MeetupsApplied,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.MEETUP.FIND
      }
    },
    {
      path: "/meetups/accepted/:meetupId",
      name: "MeetupsAccepted",
      component: MeetupsAccepted,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.MEETUP.FIND
      }
    },
    {
      path: "/meetup/:meetupId",
      name: "MeetupDetails",
      component: MeetupDetails,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.MEETUP.DETAILS
      }
    },
    {
      path: "/reports",
      name: "Reports",
      component: Reports,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.REPORT.ADD
      }
    },
    {
      path: "/report/:type/:eventId?",
      name: "Report",
      component: Report,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.REPORT.ADD
      }
    },
    {
      path: "/stats",
      name: "Stats",
      component: Stats,
      beforeEnter: requireAuth,
      meta: {
        requiredPermission: PERMISSIONS.STATS.READ
      }
    },
    {
      path: "/callback",
      component: Callback
    }
  ]
});
