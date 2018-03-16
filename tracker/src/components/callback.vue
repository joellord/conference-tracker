<template>
    <div>
      Reticulating splines...
    </div>
</template>

<script>
import { setIdToken, setAccessToken } from "../utils/auth";

export default {
  name: "",
  mounted() {
    this.$nextTick(() => {
      setAccessToken();
      setIdToken();
      window.location.href = "/";
    });
  }
};
</script>

<style scoped>

</style>
