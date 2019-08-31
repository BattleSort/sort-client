<template>
  <div>
    <h1>小さい順</h1>
    <draggable
      v-model="myArray"
      group="people"
      @start="drag = true"
      @end="drag = false"
    >
      <div class="element" v-for="element in myArray" :key="element.id">
        <p>{{ element.name }}</p>
      </div>
    </draggable>
    <button>
      Submit
    </button>
  </div>
</template>

<script>
import draggable from "vuedraggable";

export default {
  name: "room",
  components: {
    draggable
  },
  props: {
    room_id: String
  },
  data: function() {
    return {
      myArray: [
        {
          id: "aiu",
          name: "aiuf"
        },
        {
          id: "eaiu",
          name: "faenklajf"
        }
      ]
    };
  },
  created: function() {
    for (let index = 0; index < 10; index++) {
      this.myArray.push({ id: 12312 + index, name: 121 * index });
    }
    for (let i = this.myArray.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = this.myArray[i];
      this.myArray[i] = this.myArray[j];
      this.myArray[j] = tmp;
    }
  }
};
</script>

<style lang="stylus" scoped>
.element
  border 1px solid black
  p
    vertical-align  middle
.sortable-chosen
  background-color red
</style>
