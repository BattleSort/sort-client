<template>
  <div class="room-container">
    <transition name="overlay">
      <div class="overlay glass-overlay" v-if="waiting">
        <Loading v-if="!statusText.includes('終了')" />
        <p class="status-text ns-orbitron" v-if="statusText">{{ statusText }}</p>
      </div>
    </transition>
    
    <div class="countdown-overlay" v-if="countdown > 0">
      <h1 class="ns-orbitron countdown-text glow-pulse">{{ countdown }}</h1>
    </div>

    <div class="problem active-game" v-if="problem && !waiting && countdown === 0">
      <div class="round-header">
        <div class="round-indicator ns-orbitron">ROUND {{ currentRound }} / {{ totalRounds }}</div>
        <div class="timer ns-orbitron" :class="{ 'timer-low': timeLeft <= 5 }">
          TIME: {{ timeLeft }}s
        </div>
      </div>
      <h2 class="problem-title">Mission: {{ problem.name }}</h2>
      <draggable
        :animation="200"
        v-model="problem.elements"
        :group="{ name: problem.name, put: false, pull: false }"
        :disabled="hasSubmitted"
        ghostClass="sortable-ghost"
        class="drag-area"
      >
        <div class="element neon-block" v-for="element in problem.elements" :key="element">
          <p>{{ element }}</p>
        </div>
      </draggable>
      <button class="submit btn-lockin" @click="submit" :disabled="hasSubmitted">
        {{ hasSubmitted ? '確定済み！待機中...' : '[ 確定する ]' }}
      </button>
    </div>

    <!-- Round Result / Final Result Screen -->
    <div class="result-screen" v-if="result">
      <h2 class="result-title ns-orbitron" :class="isMatchEnd ? 'glow-pink' : 'glow-green'">
        {{ isMatchEnd ? 'FINAL RESULT' : `ROUND ${currentRound} RESULT` }}
      </h2>
      
      <p class="desc" v-if="!isMatchEnd">次のラウンドはすぐに開始されます...</p>
      
      <div class="leaderboard">
        <div 
          v-for="(user, index) in result" 
          :key="index"
          class="leaderboard-row glass-panel"
          :class="{ 'row-mine': user.id === myId, 'row-top': index === 0 }"
        >
          <div class="rank ns-orbitron">
            <span v-if="isMatchEnd && index === 0">👑 </span>
            {{ index + 1 }}
          </div>
          <div class="player-info">
            <span class="player-name" :class="{ 'player-name-goto': ($peerManager.idToName[user.id] || '').includes('後藤') }">
              {{ user.id === myId ? ($peerManager.idToName[user.id] || 'あなた') + ' (あなた)' : ($peerManager.idToName[user.id] || 'Player ' + user.id.substring(0,4)) }}
            </span>
            <span class="player-time ns-orbitron" v-if="!isMatchEnd">{{ (user.time / 1000).toFixed(2) }}s</span>
          </div>
          <div class="mistake-info" v-if="!isMatchEnd && user.mistakeCount > 0">
            💀 MISTAKES: {{ user.mistakeCount }}
          </div>
          <div class="scores ns-orbitron">
            <div class="round-score" v-if="!isMatchEnd">+{{ user.roundScore }} pts</div>
            <div class="total-score">{{ user.totalScore }} PTS</div>
          </div>
          <div class="player-answer" v-if="!isMatchEnd">{{ user.answer.replace(/\|/g, ' ❯ ') }}</div>
        </div>
      </div>
      
      <div class="nav-back" v-if="isMatchEnd">
        <router-link to="/" class="btn-secondary">メインメニューへ戻る</router-link>
      </div>
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
      statusText: "他のプレイヤーを待機中...",
      countdown: 0,
      hasSubmitted: false,
      
      // Match State
      totalRounds: 3,
      currentRound: 1,
      isMatchEnd: false,
      cumulativeScores: {}, // id -> total score
      
      // Round State
      mySeed: 0,
      mySeedHash: null,
      startTime: 0,
      mySubmitData: null,
      mistakeCount: 0,
      
      // Timer State
      timeLeft: 30,
      timerInterval: null,
      
      // Host State
      commitSeeds: {}, 
      revealSeeds: {}, 
      commitSubmits: {}, 
      revealSubmits: {}, 
    };
  },
  mounted() {
    if (!this.myId) {
      this.$router.push({ name: "home" });
      return;
    }

    this.$peerManager.players.forEach(p => {
      this.$set(this.cumulativeScores, p, 0);
    });

    this.$peerManager.on("message", this.processMessage);

    this.initRoundState();

    if (this.$peerManager.isHost) {
      setTimeout(() => {
        this.$peerManager.broadcast({ type: "REQ_READY" });
        this.processMessage({ senderId: this.myId, data: { type: "REQ_READY" } });
      }, 1000);
    }
  },
  methods: {
    initRoundState() {
      this.mySeed = Math.floor(Math.random() * 2147483647);
      this.mySeedHash = this.$peerManager.hash(this.mySeed);
      this.mySubmitData = null;
      this.hasSubmitted = false;
      this.mistakeCount = 0;
      this.timeLeft = 30;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.problem = null;
      this.result = null;
      
      if (this.$peerManager.isHost) {
        this.commitSeeds = {};
        this.revealSeeds = {};
        this.commitSubmits = {};
        this.revealSubmits = {};
      }
    },
    
    processMessage({ senderId, data }) {
      if (data.type === "REQ_READY") {
        this.statusText = "ランダムシードを同期中...";
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
          
          this.$peerManager.broadcast({ type: "START_ROUND", seed: finalSeed });
          this.processMessage({ senderId: this.myId, data: { type: "START_ROUND", seed: finalSeed } });
        }
      }

      if (data.type === "START_ROUND") {
        // Load problem using deterministic seed and current round offset
        this.problem = getMockProblem(1, 1, data.seed + this.currentRound * 1000);
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
        
        // Ensure revealSubmits has mistakeCount
        this.revealSubmits[senderId].mistakeCount = data.data.mistakeCount || 0;

        if (Object.keys(this.revealSubmits).length === this.$peerManager.players.length) {
          this.calculateResults();
        }
      }

      if (data.type === "ROUND_END") {
        this.problem = null;
        this.waiting = false;
        this.countdown = 0;
        
        // Output result and update cumulative state
        this.result = data.result;
        data.result.forEach(r => {
          this.cumulativeScores[r.id] = r.totalScore;
        });

        if (this.currentRound < this.totalRounds) {
          // Prepare next round automatically after interval
          setTimeout(() => {
            this.currentRound++;
            this.initRoundState();
            this.waiting = true;
            this.statusText = `ROUND ${this.currentRound} を準備中...`;
            
            if (this.$peerManager.isHost) {
              this.$peerManager.broadcast({ type: "REQ_READY" });
              this.processMessage({ senderId: this.myId, data: { type: "REQ_READY" } });
            }
          }, 6000);
        } else {
          // Match implies end
          setTimeout(() => {
            this.calculateFinalMatchScore();
          }, 3000); // Wait 3 sec to look at last round result, then show finals
        }
      }
      
      if (data.type === "MATCH_END") {
        this.isMatchEnd = true;
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
          this.startTimer();
        }
      }, 1000);
    },

    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          clearInterval(this.timerInterval);
          this.timeLeft = 0;
          if (!this.hasSubmitted) {
            this.forceSubmit();
          }
        }
      }, 1000);
    },

    forceSubmit() {
      // Penalty for timeout
      this.mistakeCount += 5; 
      this.submit(true);
    },

    submit(isForce = false) {
      if (this.hasSubmitted) return;
      
      const correctStr = this.problem.correctOrder.join("|");
      const answerStr = this.problem.elements.join("|");
      
      if (!isForce && answerStr !== correctStr) {
        this.mistakeCount++;
        this.$notify({
          group: 'foo',
          type: 'error',
          title: '不正解！',
          text: '並び順が正しくありません。もう一度挑戦してください。'
        });
        return;
      }

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.hasSubmitted = true;
      const timeMs = Date.now() - this.startTime;
      
      this.mySubmitData = { time: timeMs, answer: answerStr, mistakeCount: this.mistakeCount };
      const hash = this.$peerManager.hash(JSON.stringify(this.mySubmitData));
      
      this.$peerManager.sendToHost({ type: "SUBMIT_COMMIT", hash });
    },

    calculateResults() {
      // Create expected reference string
      const correctStr = this.problem.correctOrder.join("|");

      // Round scoring based on time AND mistakes
      const roundScores = Object.keys(this.revealSubmits)
        .map(id => ({
          id,
          time: this.revealSubmits[id].time,
          answer: this.revealSubmits[id].answer,
          mistakeCount: this.revealSubmits[id].mistakeCount || 0
        }))
        .sort((a, b) => a.time - b.time);
        
      roundScores.forEach((s, i) => {
        // Base Points Calculation (time-based and rank-based)
        let basePts = 1000 - (i * 200) - Math.floor(s.time / 50);
        if (basePts < 0) basePts = 0;

        // Points-halving penalty (based on mistakeCount per attempt)
        let pts = Math.floor(basePts / Math.pow(2, s.mistakeCount));
        
        if (s.mistakeCount > 0) {
          s.answer = `⚠️ 再挑戦 ${s.mistakeCount}回: ${s.answer.replace(/\|/g, " ❯ ")}`;
        } else {
          s.answer = s.answer.replace(/\|/g, " ❯ ");
        }

        s.roundScore = pts;
        
        // Update total
        this.cumulativeScores[s.id] += pts;
        s.totalScore = this.cumulativeScores[s.id];
      });

      this.$peerManager.broadcast({ type: "ROUND_END", result: roundScores });
      this.processMessage({ senderId: this.myId, data: { type: "ROUND_END", result: roundScores } });
    },
    
    calculateFinalMatchScore() {
      if (!this.$peerManager.isHost) return;
      
      const finalScores = Object.keys(this.cumulativeScores)
        .map(id => ({
          id,
          totalScore: this.cumulativeScores[id]
        }))
        .sort((a, b) => b.totalScore - a.totalScore); // Descending for final rank

      this.$peerManager.broadcast({ type: "MATCH_END", result: finalScores });
      this.processMessage({ senderId: this.myId, data: { type: "MATCH_END", result: finalScores } });
    }
  }
};
</script>

<style scoped>
.room-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
}

.glass-overlay {
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-color: var(--bg-panel);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.status-text {
  margin-top: 20px;
  font-size: 1.5rem;
  color: var(--neon-blue);
  letter-spacing: 2px;
}

.countdown-overlay {
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-color: rgba(0,0,0,0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.countdown-text {
  font-size: 15rem;
  margin: 0;
  color: var(--neon-pink);
  text-shadow: 0 0 20px var(--neon-pink);
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}

.glow-pulse {
  animation: pulse 1s infinite;
}

.active-game {
  width: 100%;
  max-width: 600px;
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
}

.round-indicator {
  color: var(--neon-blue);
  font-size: 1.2rem;
  letter-spacing: 2px;
}

.timer {
  font-size: 1.5rem;
  color: var(--neon-green);
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.4);
}

.timer-low {
  color: var(--neon-pink);
  text-shadow: 0 0 15px rgba(244, 114, 182, 0.6);
  animation: pulse 0.5s infinite;
}

.mistake-info {
  grid-column: 2;
  grid-row: 3;
  font-size: 0.8rem;
  color: var(--neon-pink);
  font-weight: bold;
  letter-spacing: 1px;
}
.problem-title {
  font-size: 2rem;
  color: #fff;
  margin-bottom: 30px;
  border-bottom: 2px solid var(--neon-green);
  padding-bottom: 10px;
}

.drag-area {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 300px;
}

.neon-block {
  width: 100%;
  padding: 20px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid var(--neon-blue);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.5);
  cursor: grab;
  color: #fff;
  font-size: 1.3rem;
  font-weight: bold;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.neon-block:active {
  cursor: grabbing;
}

.neon-block:hover {
  border-color: #fff;
  box-shadow: inset 0 0 10px rgba(14, 165, 233, 0.3), 0 0 15px rgba(14, 165, 233, 0.6);
  transform: translateY(-2px);
}

.neon-block p {
  margin: 0;
}

.sortable-ghost {
  opacity: 0.1;
  border: 1px dashed #fff;
}

.btn-lockin {
  width: 100%;
  padding: 20px;
  margin-top: 40px;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Orbitron', sans-serif;
  background: rgba(236, 72, 153, 0.1);
  color: #fff;
  border: 2px solid var(--neon-pink);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.btn-lockin:hover:not(:disabled) {
  background: rgba(236, 72, 153, 0.3);
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.6);
}

.btn-lockin:disabled {
  border-color: #475569;
  background: #1e293b;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.result-screen {
  width: 100%;
  max-width: 800px;
  margin-top: 20px;
}

.result-title {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 10px;
}

.glow-green { color: var(--neon-green); text-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
.glow-pink { color: var(--neon-pink); text-shadow: 0 0 15px rgba(236, 72, 153, 0.6); }

.desc {
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 30px;
}

.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.glass-panel {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 60px 1fr 180px;
  grid-template-rows: auto auto;
  gap: 10px;
  padding: 20px;
  align-items: center;
}

.row-mine {
  border-color: var(--neon-blue);
  box-shadow: inset 0 0 15px rgba(14, 165, 233, 0.1);
}

.row-top .rank {
  color: #facc15;
}

.rank {
  grid-column: 1;
  grid-row: 1 / 3;
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--text-muted);
  text-align: center;
}

.player-info {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
}

.player-time {
  color: var(--text-muted);
}

.scores {
  grid-column: 3;
  grid-row: 1 / 3;
  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: center;
  white-space: nowrap;
}

.round-score {
  font-size: 1rem;
  color: var(--neon-green);
}

.total-score {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
}

.player-answer {
  grid-column: 2;
  grid-row: 2;
  font-size: 0.9rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-back {
  margin-top: 50px;
  text-align: center;
}

.btn-secondary {
  color: var(--text-muted);
  text-decoration: none;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 15px 30px;
  border-radius: 8px;
  transition: all 0.3s;
  font-weight: bold;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.player-name-goto {
  color: var(--neon-pink) !important;
  text-shadow: 0 0 10px rgba(244, 114, 182, 0.5);
}
</style>
