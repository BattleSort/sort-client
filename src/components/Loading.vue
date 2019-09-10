<template>
  <div class="loader">
    <div class="line-scale-pulse-out-rapid">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div></div
></template>

<script>
import "loaders.css";

export default {
  name: "Loading"
};
</script>

<style lang="stylus" scoped>
.line-scale-pulse-out-rapid > div
  background-color green
</style>
