<template>
  <div>
    <div v-if="problem">
      <h2>{{ problem.name }}</h2>
      <draggable
        v-model="problem.elements"
        v-bind:group="problem.name"
        @start="drag = true"
        @end="drag = false"
      >
        <div class="element" v-for="element in problem.elements" :key="element">
          <p>{{ element }}</p>
        </div>
      </draggable>
      <button v-on:click="submit()">
        Submit
      </button>
    </div>
    <div v-if="result">
      <div id="nav"><router-link to="/">Home</router-link></div>
      <table>
        <tr v-for="(user, index) in result" :key="index">
          <td v-bind:class="{ mine: user.id === user_id }">
            <!-- どういうデータ渡すかがログイン次第で決まらん -->
            <p v-if="user.id === user_id">You</p>
            <p>id: {{ user.id }}</p>
            <p>score: {{ user.score }}</p>
            <ul>
              <li v-for="(value, name, index) in user.problems" :key="index">
                {{ name }} : {{ value }}
              </li>
            </ul>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import MD5 from "crypto-js/md5";
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
      problem: null,
      user_id: null,
      result: null
    };
  },
  mounted: function() {
    this.user_id = this.$store.getters.user_id;
    console.log(this.user_id + " とれてる");
    let _this = this;
    console.log(this.$route.params.room_id);
    this.subscriptions = this.$cable.subscriptions.create(
      {
        channel: "RoomChannel",
        user_id: this.user_id,
        room_id: this.$route.params.room_id
      },
      // _thisを忘れずに
      {
        connected() {
          console.log("connected room " + _this.$route.params.room_id);

          // Called when the subscription is ready for use on the server
        },
        disconnected() {
          console.log("disconnected");
          // Called when the subscription has been terminated by the server
        },
        received(data) {
          // Called when there's incoming data on the websocket for this channel
          switch (data.type) {
            case "gameEnd":
              _this.problem = null;
              _this.result = JSON.parse(data.result);
              _this.$cable.disconnect();
              break;
            case "deliverProblem":
              _this.problem = data.problem;
              break;
            default:
              break;
          }
          if (data.message) {
            _this.$notify({
              group: "notice",
              title: data.message
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
    submit() {
      this.subscriptions.submit({
        problem_id: this.problem.id,
        answer: MD5(this.problem.elements.join("")).toString(),
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
td
  border aliceblue 5px solid
.mine
  background-color aliceblue
</style>
