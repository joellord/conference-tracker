// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "c3/c3.css";

import Vue from "vue";
import VueClipboard from "vue-clipboard2";
import BootstrapVue from "bootstrap-vue";

import App from "./App";
import router from "./router";

Vue.use(BootstrapVue);
Vue.use(VueClipboard);

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  components: { App },
  template: "<App/>"
});
