<template>
  <div>
    <transition name="overlay">
      <div class="overlay" v-if="waiting">
        <Loading />
        <p v-if="statusText">{{ statusText }}</p>
      </div>
    </transition>
    
    <div class="countdown-overlay" v-if="countdown > 0">
      <h1>{{ countdown }}</h1>
    </div>

    <div class="problem" v-if="problem && !waiting && countdown === 0">
      <h2>{{ problem.name }}</h2>
      <draggable
        :animation="200"
        v-model="problem.elements"
        :group="{ name: problem.name, put: false, pull: false }"
        ghostClass="sortable-ghost"
      >
        <div class="element" v-for="element in problem.elements" :key="element">
          <p>{{ element }}</p>
        </div>
      </draggable>
      <button class="submit" @click="submit" :disabled="hasSubmitted">
        {{ hasSubmitted ? 'Submitted...' : 'Submit' }}
      </button>
    </div>

    <div v-if="result">
      <div id="nav"><router-link to="/">Home</router-link></div>
      <table>
        <tr v-for="(user, index) in result" :key="index">
          <td :class="{ mine: user.id === myId }">
            <p v-if="user.id === myId">You</p>
            <p>Peer: {{ user.id.substring(0,6) }}</p>
            <p>Score: {{ user.score }}</p>
            <p>Time: {{ user.time }}ms</p>
            <ul>
              <li>{{ user.answer }}</li>
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
import { getMockProblem } from "../game/mockProblems";

export default {
  name: "Room",
  components: {
    draggable,
    Loading
  },
  props: {
    room_id: String
  },
  data() {
    return {
      myId: this.$peerManager.myPeerId,
      problem: null,
      result: null,
      waiting: true,
      statusText: "Waiting to start...",
      countdown: 0,
      hasSubmitted: false,
      
      // Game State
      mySeed: Math.floor(Math.random() * 2147483647),
      mySeedHash: null,
      startTime: 0,
      mySubmitData: null,
      
      // Host State
      commitSeeds: {}, // id -> hash
      revealSeeds: {}, // id -> seed
      commitSubmits: {}, // id -> hash
      revealSubmits: {}, // id -> data
    };
  },
  mounted() {
    if (!this.myId) {
      this.$router.push({ name: "home" });
      return;
    }

    this.mySeedHash = this.$peerManager.hash(this.mySeed);
    
    this.$peerManager.on("message", this.processMessage);

    // If host, kick off the protocol
    if (this.$peerManager.isHost) {
      setTimeout(() => {
        this.$peerManager.broadcast({ type: "REQ_READY" });
        this.processMessage({ senderId: this.myId, data: { type: "REQ_READY" } });
      }, 1000);
    }
  },
  destroyed() {
    // Optionally clean up listeners
  },
  methods: {
    processMessage({ senderId, data }) {
      if (data.type === "REQ_READY") {
        this.statusText = "Syncing random seed...";
        this.$peerManager.sendToHost({ type: "READY_COMMIT", hash: this.mySeedHash });
      }
      
      if (this.$peerManager.isHost && data.type === "READY_COMMIT") {
        this.commitSeeds[senderId] = data.hash;
        if (Object.keys(this.commitSeeds).length === this.$peerManager.players.length) {
          this.$peerManager.broadcast({ type: "REQ_READY_REVEAL" });
          this.processMessage({ senderId: this.myId, data: { type: "REQ_READY_REVEAL" } });
        }
      }

      if (data.type === "REQ_READY_REVEAL") {
        this.$peerManager.sendToHost({ type: "READY_REVEAL", seed: this.mySeed });
      }

      if (this.$peerManager.isHost && data.type === "READY_REVEAL") {
        this.revealSeeds[senderId] = data.seed;
        // Verify hash
        if (this.$peerManager.hash(data.seed) !== this.commitSeeds[senderId]) {
          console.error("Hash mismatch for", senderId);
        }
        
        if (Object.keys(this.revealSeeds).length === this.$peerManager.players.length) {
          let finalSeed = 0;
          Object.values(this.revealSeeds).forEach(s => finalSeed ^= s);
          
          this.$peerManager.broadcast({ type: "START_GAME", seed: finalSeed });
          this.processMessage({ senderId: this.myId, data: { type: "START_GAME", seed: finalSeed } });
        }
      }

      if (data.type === "START_GAME") {
        // Load problem using deterministic seed
        this.problem = getMockProblem(1, 1, data.seed);
        this.waiting = false;
        this.startCountdown();
      }

      if (this.$peerManager.isHost && data.type === "SUBMIT_COMMIT") {
        this.commitSubmits[senderId] = data.hash;
        if (Object.keys(this.commitSubmits).length === this.$peerManager.players.length) {
          this.$peerManager.broadcast({ type: "REQ_SUBMIT_REVEAL" });
          this.processMessage({ senderId: this.myId, data: { type: "REQ_SUBMIT_REVEAL" } });
        }
      }

      if (data.type === "REQ_SUBMIT_REVEAL") {
        this.$peerManager.sendToHost({ type: "SUBMIT_REVEAL", data: this.mySubmitData });
      }

      if (this.$peerManager.isHost && data.type === "SUBMIT_REVEAL") {
        this.revealSubmits[senderId] = data.data;
        const expectedHash = this.$peerManager.hash(JSON.stringify(data.data));
        if (expectedHash !== this.commitSubmits[senderId]) {
           console.error("Submit hash mismatch!", senderId);
        }

        if (Object.keys(this.revealSubmits).length === this.$peerManager.players.length) {
          this.calculateResults();
        }
      }

      if (data.type === "GAME_END") {
        this.problem = null;
        this.waiting = false;
        this.countdown = 0;
        this.result = data.result;
      }
    },

    startCountdown() {
      this.countdown = 3;
      const interval = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(interval);
          this.startTime = Date.now();
        }
      }, 1000);
    },

    submit() {
      if (this.hasSubmitted) return;
      this.hasSubmitted = true;
      const timeMs = Date.now() - this.startTime;
      const answerStr = this.problem.elements.join("|");
      
      this.mySubmitData = { time: timeMs, answer: answerStr };
      const hash = this.$peerManager.hash(JSON.stringify(this.mySubmitData));
      
      this.statusText = "Waiting for other players to finish...";
      this.waiting = true;
      this.$peerManager.sendToHost({ type: "SUBMIT_COMMIT", hash });
    },

    calculateResults() {
      // Very basic scoring: sort by time. In reality, check answer correctness too.
      const scores = Object.keys(this.revealSubmits)
        .map(id => ({
          id,
          time: this.revealSubmits[id].time,
          answer: this.revealSubmits[id].answer
        }))
        .sort((a, b) => a.time - b.time);
        
      scores.forEach((s, i) => {
        s.score = 1000 - (i * 100) - Math.floor(s.time / 100);
      });

      this.$peerManager.broadcast({ type: "GAME_END", result: scores });
      this.processMessage({ senderId: this.myId, data: { type: "GAME_END", result: scores } });
    }
  }
};
</script>

<style lang="stylus" scoped>
.overlay
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-color: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  p
    margin-top: 20px
    font-size: 1.2em
    font-weight: bold
    
.countdown-overlay
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  h1
    font-size: 10em;
    color: white;

.problem
  margin-top 50px
  display flex
  flex-direction column
  align-items center

.element
  width 80%
  max-width: 300px;
  margin 10px auto
  border 2px solid #3b82f6
  border-radius: 8px;
  background-color #eff6ff
  p
    vertical-align  middle
    font-size 1.2em
    font-weight bold
    padding 10px 0

.submit
  outline: none;
  width 80%
  max-width: 300px;
  background-color #10b981
  color white
  font-size 1.2em
  font-weight bold
  height  60px
  border-radius 8px
  border none
  margin-top 30px
  cursor pointer
.submit:disabled
  background-color #9ca3af

.sortable-chosen
  opacity 0.5
td
  border aliceblue 5px solid
  padding 15px
.mine
  background-color #eff6ff
.sortable-ghost
  visibility hidden
table
  width 100%
  max-width 600px
  margin 0 auto
  border-collapse collapse
</style>
