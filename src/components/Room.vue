<template>
  <div>
    <div v-for="(problem, index) in problems" :key="index">
      <h2>{{ problem.name }}</h2>
      <draggable
        v-model="problems[index].elements"
        v-bind:group="index"
        @start="drag = true"
        @end="drag = false"
      >
        <div class="element" v-for="element in problem.elements" :key="element">
          <p>{{ element }}</p>
        </div>
      </draggable>
      <button v-on:click="submit(index)">
        Submit
      </button>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import ActionCable from "actioncable";
import MD5 from "crypto-js/md5";

const createConsumer = ActionCable.createConsumer(
  "ws://192.168.100.101:3001/cable"
);
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
      problems: null,
      user_id: null
    };
  },
  created: function() {
    this.user_id = Math.floor(Math.random() * 100) + 1;
    let _this = this;
    console.log(this.$route.params.room_id);
    this.subscriptions = createConsumer.subscriptions.create(
      {
        channel: "RoomChannel",
        user_id: this.user_id,
        room_id: this.$route.params.room_id
      },
      // _thisを忘れずに
      {
        connected() {
          console.log("connected room " + _this.user_id);

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
              _this.problems = data.problems;
              break;
            default:
              break;
          }
          if (data.message) {
            _this.$notify({
              group: "notice",
              title: data.message,
              text: data.message
            });
          }
          console.log(data);
        },
        submit(obj) {
          this.perform("submit", obj);
        }
      }
    );
  },
  methods: {
    submit(index) {
      // def submit(problem_id, ans_hash, user_id)
      console.log(index);
      this.subscriptions.submit({
        problem_id: this.problems[index].id,
        answer: MD5(this.problems[index].elements.join("")).toString(),
        user_id: this.user_id
      });
    }
  }
};
</script>

<style lang="stylus" scoped>
.element
  width 80%
  border 1px solid black
  p
    vertical-align  middle
.sortable-chosen
  background-color red
</style>
