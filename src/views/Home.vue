<template>
  <div class="home">
    <SelectMatch />
    <!-- <Login /> -->
  </div>
</template>

<script>
// @ is an alias to /src
import SelectMatch from "@/components/SelectMatch.vue";
// import Login from "@/components/Login.vue";

export default {
  name: "home",
  components: {
    SelectMatch //,
    // Login
  }
};
</script>
