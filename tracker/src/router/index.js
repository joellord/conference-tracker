import Vue from "vue";
import Router from "vue-router";
import Welcome from "@/components/welcome";
import Dashboard from "@/components/dashboard";
import Callback from "@/components/callback";

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
      path: "/dashboard",
      name: "Dashboard",
      component: Dashboard
    },
    {
      path: "/callback",
      component: Callback
    }
  ]
});
