<template>
  <div class="match-container">
    <div class="card glass-panel" v-if="mode === 'select'">
      <h2>ローカルP2P対戦</h2>
      <p class="desc">友達とルームIDを共有して遊ぼう！</p>
      
      <div class="nickname-input">
        <input type="text" v-model="nickname" placeholder="ニックネームを入力" class="input-field-small" maxlength="10" />
      </div>

      <div class="buttons">
        <button class="btn btn-neon-blue" @click="startHost">
          <span class="icon">💻</span> ルームを作成する
        </button>
        <button class="btn btn-neon-green" @click="mode = 'join'">
          <span class="icon">🔌</span> ルームに参加する
        </button>
      </div>
    </div>

    <div class="card glass-panel" v-if="mode === 'host'">
      <h2>🏠 ルームを作成中</h2>
      <p class="desc">このルームIDを対戦相手に教えてください</p>
      <div class="room-id-box">
        <h3 class="room-id ns-orbitron">{{ roomId }}</h3>
      </div>
      
      <div class="players-list">
        <div class="list-header">参加者 ({{ players.length }} / 4)</div>
        <ul>
          <li v-for="p in players" :key="p" :class="{ me: p === myId }">
            {{ p === myId ? ($peerManager.idToName[p] || p.substring(0,6)) + ' (あなた)' : ($peerManager.idToName[p] || p.substring(0,6)) }}
          </li>
        </ul>
      </div>

      <button class="btn btn-neon-pink start-btn" :disabled="players.length < 2" @click="startGame">
        ゲーム開始
      </button>
      <button class="btn btn-secondary" @click="mode = 'select'">戻る</button>
    </div>

    <div class="card glass-panel" v-if="mode === 'join'">
      <h2>🔌 ルームに参加</h2>
      
      <template v-if="!isConnected">
        <p class="desc">教えてもらったルームIDを入力</p>
        <input type="text" v-model="joinId" placeholder="ROOM ID" class="input-field ns-orbitron" />
        
        <button class="btn btn-neon-green" :disabled="!joinId" @click="joinGame">
          参加する
        </button>
        <p class="status-msg" v-if="joinStatus" :class="{ error: joinStatus.includes('エラー') }">
          {{ joinStatus }}
        </p>
        <button class="btn btn-secondary" @click="mode = 'select'">戻る</button>
      </template>
      
      <template v-else>
        <div class="room-id-box">
           <h3 class="room-id ns-orbitron">{{ joinId.toUpperCase() }}</h3>
        </div>
        <p class="desc glow-text">ホストが開始するのを待機中...</p>
        
        <div class="players-list">
        <div class="list-header">現在の参加者 ({{ players.length }} / 4)</div>
        <ul>
          <li v-for="p in players" :key="p" :class="{ me: p === myId }">
            {{ p === myId ? ($peerManager.idToName[p] || p.substring(0,6)) + ' (あなた)' : ($peerManager.idToName[p] || p.substring(0,6)) }}
          </li>
        </ul>
        </div>
        
        <button class="btn btn-secondary" @click="disconnect">退出する</button>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: "SelectMatch",
  data() {
    return {
      mode: "select",
      roomId: "",
      myId: "",
      joinId: "",
      players: [],
      joinStatus: "",
      isConnected: false,
      nickname: localStorage.getItem("btl_sort_name") || ""
    };
  },
  watch: {
    nickname(newVal) {
      localStorage.setItem("btl_sort_name", newVal);
    }
  },
  created() {
    this.$peerManager.on("PLAYERS_UPDATE", (data) => {
      this.players = data.players;
    });
    this.$peerManager.on("message", ({ data }) => {
      if (data && data.type === "MOVE_ROOM") {
        this.$router.push({
          name: "room",
          params: { room_id: data.roomId }
        });
      }
    });
  },
  methods: {
    async startHost() {
      if (!this.nickname) {
        this.joinStatus = "ニックネームを入力してください";
        return;
      }
      this.mode = "host";
      this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        const id = await this.$peerManager.beHost(this.roomId, this.nickname);
        this.myId = id;
        this.players = this.$peerManager.players;
      } catch (e) {
        console.error("Failed to host", e);
      }
    },
    async joinGame() {
      if (!this.nickname) {
        this.joinStatus = "ニックネームを入力してください";
        return;
      }
      this.joinStatus = "接続中...";
      try {
        const id = await this.$peerManager.joinRoom(this.joinId.toUpperCase(), this.nickname);
        this.myId = id;
        this.players = this.$peerManager.players; // Initial list (at least contains self)
        this.isConnected = true;
      } catch (e) {
        this.joinStatus = "エラー：ルームが見つかりません。";
        console.error(e);
      }
    },
    disconnect() {
      // In a real app we would disconnect PeerJS properly here
      window.location.reload(); 
    },
    startGame() {
      this.$peerManager.broadcast({ type: "MOVE_ROOM", roomId: this.roomId });
      this.$router.push({
        name: "room",
        params: { room_id: this.roomId }
      });
    }
  }
};
</script>

<style scoped>
.match-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  perspective: 1000px;
}

.glass-panel {
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 40px;
  width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  color: var(--text-main);
  /* Removed heavy backdrop-filter to improve text readability on dark bg */
}

h2 {
  margin-top: 0;
  color: #fff;
  font-size: 1.8rem;
  letter-spacing: 1px;
}

.desc {
  color: var(--text-muted);
  margin-bottom: 30px;
  font-size: 0.95rem;
}

.glow-text {
  color: var(--neon-blue);
  font-weight: bold;
  animation: slowPulse 2s infinite;
}

@keyframes slowPulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.btn {
  padding: 16px 20px;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-neon-blue {
  background: #0284c7;
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.2);
}

.btn-neon-blue:hover {
  background: #0369a1;
  box-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
}

.btn-neon-green {
  background: #059669;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
}

.btn-neon-green:hover {
  background: #047857;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}

.btn-neon-pink {
  background: #db2777;
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.2);
}

.btn-neon-pink:hover:not(:disabled) {
  background: #be185d;
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.4);
}

.btn-secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.2);
  margin-top: 15px;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.room-id-box {
  background: #000;
  border: 1px solid var(--neon-blue);
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.room-id {
  font-size: 2.5rem;
  margin: 0;
  color: var(--neon-blue);
  text-shadow: 0 0 8px rgba(14, 165, 233, 0.6);
}

.players-list {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 25px;
  text-align: left;
}

.list-header {
  font-weight: bold;
  color: var(--neon-green);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.players-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.players-list li {
  padding: 8px 0;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.players-list li::before {
  content: '👤';
  margin-right: 10px;
  font-size: 0.8em;
}

.players-list li.me {
  color: #fff;
  font-weight: bold;
}

.input-field {
  width: 100%;
  padding: 15px;
  font-size: 1.5rem;
  background: #000;
  border: 1px solid var(--neon-green);
  color: var(--neon-green);
  border-radius: 8px;
  margin-bottom: 25px;
  box-sizing: border-box;
  text-align: center;
}

.input-field-small {
  width: 100%;
  padding: 12px;
  font-size: 1.1rem;
  background: rgba(0,0,0,0.5);
  border: 1px solid var(--neon-blue);
  color: #fff;
  border-radius: 6px;
  margin-bottom: 20px;
  box-sizing: border-box;
  text-align: center;
}

.nickname-input {
  width: 100%;
}

.input-field:focus, .input-field-small:focus {
  outline: none;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.status-msg {
  margin-top: 15px;
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--neon-blue);
}

.status-msg.error {
  color: #ef4444;
}
</style>
