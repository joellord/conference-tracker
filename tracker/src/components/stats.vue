<template>
  <div class="stats">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>Data is beautiful 🌈</h2>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <b-row>
      <b-col cols="10" offset="1">
        <b-card class="text-center">
          So far this year, the evangelism team attended <b>{{ stats.general.totalEvents }} events</b>,
          reaching out to <b>{{ stats.general.totalDevelopersReached }} developers</b>.
        </b-card>
      </b-col>
    </b-row>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <div class="subsection-title">
      <h5>Developers Reached per Month</h5>
    </div>

    <div class="container">
        <div id="devReachByMonth"></div>
    </div>

    <div class="subsection-title">
      <h5>Developers Reached by Source</h5>
    </div>

    <div class="container">
      <div id="devReachBySource"></div>
    </div>

    <div class="subsection-title">
      <h5>Developers Reached by Type</h5>
    </div>

    <div class="container">
      <div id="devReachByType"></div>
    </div>

  </div>
</template>

<script>
import c3 from "c3";
import AppNav from "./AppNav";
import { getStats } from "../utils/conf-api";

export default {
  components: { AppNav },
  name: "stats",
  mounted() {
    const devReachedByMonth = c3.generate({
      bindto: "#devReachByMonth",
      data: { columns: [] },
      axis: {
        x: {
          type: "category",
          categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          label: {
            text: "Month",
            position: "outer-middle"
          }
        }
      }
    });
    const devReachedBySource = c3.generate({
      bindto: "#devReachBySource",
      size: { height: "300px" },
      data: { type: "pie", columns: [] }
    });
    const devReachedByType = c3.generate({
      bindto: "#devReachByType",
      size: { height: "300px" },
      data: { type: "pie", columns: [] }
    });
    getStats().then((stats) => {
      this.stats = stats;
      const monthlyStats = [
        ["Total"],
        ["Americas"],
        ["EMEA"],
        ["APAC"]
      ];
      stats.monthly.map((s) => {
        monthlyStats[0].push(s.total);
        monthlyStats[1].push(s.americas);
        monthlyStats[2].push(s.emea);
        monthlyStats[3].push(s.apac);
        return s;
      });
      devReachedByMonth.load({
        columns: monthlyStats
      });
      devReachedByMonth.resize();
      devReachedBySource.load({
        columns: [
          ["Evangelism", stats.general.sourceEvangelism],
          ["Ambassadors External", stats.general.sourceAmbExt],
          ["Ambassadors Internal", stats.general.sourceAmbInt]
        ]
      });
      devReachedByType.load({
        columns: [
          ["Conferences", stats.general.typeConference],
          ["Meetups", stats.general.typeMeetup],
          ["Online Meetups", stats.general.typeOnlineMeetup],
          ["Online Courses", stats.general.typeOnlineCourse]
        ]
      });
    });
  },
  data() {
    return {
      stats: {
        general: {}
      }
    };
  }
};

</script>

<style scoped>

</style>
