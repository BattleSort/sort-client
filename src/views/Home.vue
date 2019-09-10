<template>
  <div class="home">
    <h1>Battle Sort</h1>
    <SelectMatch />
    <p>version 0.0.3</p>
  </div>
</template>

<script>
// @ is an alias to /src
import SelectMatch from "@/components/SelectMatch.vue";

export default {
  name: "home",
  components: {
    SelectMatch //,
    // Login
  }
};
</script>
