<template>
    <div>
      Reticulating splines...
    </div>
</template>

<script>
import jwtDecode from "jwt-decode";
import { getIdToken, setIdToken, setAccessToken } from "../utils/auth";
import { createLocalUser } from "../utils/conf-api";

export default {
  name: "",
  mounted() {
    this.$nextTick(() => {
      setAccessToken();
      setIdToken();
      const user = jwtDecode(getIdToken());
      createLocalUser({
        name: user.name,
        picture: user.picture
      });
      window.location.href = "/conferences";
    });
  }
};
</script>

<style scoped>

</style>
