<template>
  <div>
    <transition name="overlay">
      <div class="overlay" v-if="waiting">
        <Loading />
      </div>
    </transition>
    <div class="problem" v-if="problem">
      <h2>{{ problem.name }}</h2>
      <draggable
        :animation="200"
        v-model="problem.elements"
        v-bind:group="{ name: problem.name, put: false, pull: false }"
        ghostClass="sortable-ghost"
        @start="drag = true"
        @end="drag = false"
      >
        <div class="element" v-for="element in problem.elements" :key="element">
          <p>{{ element }}</p>
        </div>
      </draggable>
      <button class="submit" v-on:click="submit()">
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
import Loading from "@/components/Loading.vue";
export default {
  name: "Room",
  components: {
    draggable,
    Loading
  },
  props: {
    room_id: String
  },
  data: function() {
    return {
      subscriptions: null,
      problem: null,
      user_id: null,
      result: null,
      waiting: false
    };
  },
  mounted: function() {
    this.user_id = this.$store.getters.user_id;
    if (!this.user_id) {
      this.$router.push({
        name: "home"
      });
      return;
    }
    console.log(this.user_id + " とれてる");
    console.log(this.$route.params.room_id);
    let _this = this;
    this.subscriptions = this.$store.getters.cable.subscriptions.create(
      {
        channel: "RoomChannel",
        user_id: this.user_id,
        room_id: this.$route.params.room_id
      },
      // _thisを忘れずに
      {
        connected() {
          console.log("connected room " + _this.$route.params.room_id);
        },
        disconnected() {
          console.log("disconnected");
        },
        received(data) {
          _this.waiting = false;
          switch (data.type) {
            case "gameEnd":
              _this.problem = null;
              _this.result = JSON.parse(data.result);
              _this.$store.commit("deleteSubscriptions");
              break;
            case "deliverProblem":
              _this.problem = data.problem;
              _this.problem.received_time = new Date();
              break;
            default:
              break;
          }
          if (data.message) {
            _this.$notify({
              group: "notice",
              title: data.message,
              duration: 100
            });
          }
          console.log(data);
        },
        submit(obj) {
          this.perform("submit", obj);
          _this.waiting = true;
        }
      }
    );
  },
  ready() {
    // FIXME: これinput要素ないとだめみたい
    // window.addEventListener("beforeunload", this.leaving);
  },
  methods: {
    submit() {
      this.subscriptions.submit({
        problem_id: this.problem.id,
        answer: this.problem.elements.join("|"),
        required_time: new Date() - this.problem.received_time
      });
    },
    leaving() {
      console.log("test");
      return "本当に離脱しますか？";
    }
  }
};
</script>

<style lang="stylus" scoped>
.overlay
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-color: rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
.overlay-enter-active, .overlay-leave-active
  transition: opacity .3s;
.overlay-enter, .overlay-leave-to
  opacity 0;

.problem
  margin-top 50px

.element
  width 80%
  max-width: 300px;
  margin 0 auto
  border 1px solid black
  p
    vertical-align  middle

.submit
  outline: none;
  width 80%
  max-width: 300px;
  background-color aliceblue
  height  50px
  margin-top 30px

.sortable-chosen
  background-color red
td
  border aliceblue 5px solid
.mine
  background-color aliceblue
.sortable-ghost
  visibility hidden
</style>
