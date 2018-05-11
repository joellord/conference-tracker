<template>
  <div class="talks">
    <app-nav></app-nav>

    <b-row><b-col>&nbsp;</b-col></b-row>

    <h2>My talks</h2>

    <b-row>
      <b-col class="text-right">
        <talk-add-modal @talkAdded="getMyTalks()"></talk-add-modal>
      </b-col>
    </b-row>

    <b-row><b-col></b-col></b-row>

    <b-row>
      <b-col>
        <table class="table table-striped">
          <thead class="thead-dark">
          <tr>
            <th scope="col">Talk Title</th>
            <th scope="col">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="talk in talks" :key="talk.id">
            <td>
              <router-link :to="'talk/' + talk._id">{{ talk.title }}</router-link>
            </td>
            <td>
              N/A
            </td>
          </tr>
          </tbody>
        </table>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import AppNav from "./AppNav";
import TalkAddModal from "./talk-add-modal";
import { getMyTalks } from "../utils/conf-api";

export default {
  name: "talks",
  components: { AppNav, TalkAddModal },
  data() {
    return {
      talks: []
    };
  },
  mounted() {
    this.getMyTalks();
  },
  methods: {
    getMyTalks() {
      getMyTalks().then((talks) => {
        this.talks = talks;
      });
    }
  }
};
</script>

<style scoped>

</style>
