<template>
    <div>
      Reticulating splines...
    </div>
</template>

<script>
import jwtDecode from "jwt-decode";
import { getIdToken, setIdToken, setAccessToken } from "../utils/auth";
import { saveLocalUser } from "../utils/conf-api";

export default {
  name: "",
  mounted() {
    this.$nextTick(() => {
      setAccessToken();
      setIdToken();
      const user = jwtDecode(getIdToken());
      console.log(user);
      saveLocalUser({
        name: user.name,
        picture: user.picture,
        email: user.email
      }).then(() => {
        this.$router.push("/upcoming");
      });
    });
  }
};
</script>

<style scoped>

</style>
