<template>
  <Room v-bind:room_id="this.$router.roomId" />
</template>

<script>
import Room from "@/components/Room.vue";
export default {
  name: "room",
  components: {
    Room
  }
};
</script>

<style lang="stylus" scoped></style>
