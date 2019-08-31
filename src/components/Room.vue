<template>
  <div>
    <h1>小さい順</h1>
    <draggable
      v-model="elements"
      group="people"
      @start="drag = true"
      @end="drag = false"
    >
      <div class="element" v-for="element in elements" :key="element">
        <p>{{ element }}</p>
      </div>
    </draggable>
    <button>
      Submit
    </button>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import ActionCable from "actioncable";
const createConsumer = ActionCable.createConsumer("ws://localhost:3001/cable");
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
      subscriptions: null,
      elements: []
    };
  },
  created: function() {
    var user_id = Math.floor(Math.random() * 100) + 1;
    let _this = this;
    console.log(this.$route.params.room_id);
    this.subscriptions = createConsumer.subscriptions.create(
      {
        channel: "RoomChannel",
        user_id: user_id,
        room_id: this.$route.params.room_id
      },
      {
        connected() {
          console.log("connected room " + user_id);

          // Called when the subscription is ready for use on the server
        },
        disconnected() {
          console.log("disconnected");
          // Called when the subscription has been terminated by the server
        },
        received(data) {
          // Called when there's incoming data on the websocket for this channel
          switch (data.type) {
            case "battleStart":
              _this.elements = data.problems[0].elements;
              break;
            default:
              break;
          }
          console.log(data);
        }
      }
    );
    // for (let index = 0; index < 10; index++) {
    //   this.myArray.push({ id: 12312 + index, name: 121 * index });
    // }
    // for (let i = this.myArray.length - 1; i > 0; i--) {
    //   var j = Math.floor(Math.random() * (i + 1));
    //   var tmp = this.myArray[i];
    //   this.myArray[i] = this.myArray[j];
    //   this.myArray[j] = tmp;
    // }
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
