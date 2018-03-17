<template>
  <span class="text-left">
    <b-btn class="btn btn-success" v-b-modal.talkAddModal>+ Add</b-btn>

    <b-modal size="lg" id="talkAddModal" title="Add Conference" @ok="handleOk" @show="onShown" ref="modal">
      <b-form>
        <b-row>
          <b-col>
            <b-form-group label="Talk Title" label-for="name">
              <b-form-input id="name" type="text" required placeholder="Clickbait Title" v-model="talk.title"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
      </b-form>
    </b-modal>
  </span>
</template>

<script>
import { addTalk } from "../utils/conf-api";

export default {
  name: "talk-add-modal",
  data() {
    return {
      talk: {
        title: ""
      }
    };
  },
  methods: {
    handleOk() {
      addTalk(this.talk).then(() => this.$emit("talkAdded", {}));
    },
    onShown() {
      this.talk.title = "";
    }
  }
};
</script>

<style scoped>

</style>
