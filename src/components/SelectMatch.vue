<template>
  <div class="match-container">
    <div class="card" v-if="mode === 'select'">
      <h2>Play Locally via P2P</h2>
      <div class="buttons">
        <button class="btn primary" @click="startHost">Host a Game</button>
        <button class="btn secondary" @click="mode = 'join'">Join a Game</button>
      </div>
    </div>

    <div class="card" v-if="mode === 'host'">
      <h2>Host a Game</h2>
      <p>Share this Room ID with your friends:</p>
      <h3 class="room-id">{{ roomId }}</h3>
      <p>Players joined: {{ players.length }} / 4</p>
      <ul>
        <li v-for="p in players" :key="p">{{ p === myId ? p + ' (You)' : p }}</li>
      </ul>
      <button class="btn start-btn" :disabled="players.length < 2" @click="startGame">
        Start Game
      </button>
      <button class="btn back" @click="mode = 'select'">Back</button>
    </div>

    <div class="card" v-if="mode === 'join'">
      <h2>Join a Game</h2>
      <input type="text" v-model="joinId" placeholder="Enter Room ID" class="input-field" />
      <button class="btn primary" :disabled="!joinId" @click="joinGame">
        Join Game
      </button>
      <p v-if="joinStatus">{{ joinStatus }}</p>
      <button class="btn back" @click="mode = 'select'">Back</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SelectMatch",
  data() {
    return {
      mode: "select", // select, host, join
      roomId: "",
      myId: "",
      joinId: "",
      players: [],
      joinStatus: ""
    };
  },
  created() {
    this.$peerManager.on("PLAYERS_UPDATE", (data) => {
      this.players = data.players;
    });
    this.$peerManager.on("message", ({ data }) => {
      if (data.type === "MOVE_ROOM") {
        this.$router.push({
          name: "room",
          params: { room_id: data.roomId }
        });
      }
    });
  },
  methods: {
    async startHost() {
      this.mode = "host";
      this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        const id = await this.$peerManager.beHost(this.roomId);
        this.myId = id;
        this.players = this.$peerManager.players;
      } catch (e) {
        console.error("Failed to host", e);
      }
    },
    async joinGame() {
      this.joinStatus = "Connecting...";
      try {
        const id = await this.$peerManager.joinRoom(this.joinId.toUpperCase());
        this.myId = id;
        this.joinStatus = "Connected! Waiting for host to start...";
      } catch (e) {
        this.joinStatus = "Failed to connect. Is the ID correct?";
        console.error(e);
      }
    },
    startGame() {
      // The host moves everyone to the game room
      this.$peerManager.broadcast({ type: "MOVE_ROOM", roomId: this.roomId });
      this.$router.push({
        name: "room",
        params: { room_id: this.roomId }
      });
    }
  }
};
</script>

<style lang="stylus" scoped>
.match-container
  display flex
  justify-content center
  margin-top 40px

.card
  background-color #f9fafb
  border 1px solid #e5e7eb
  border-radius 8px
  padding 30px
  width 400px
  box-shadow 0 4px 6px -1px rgba(0, 0, 0, 0.1)

h2
  margin-top 0
  color #1f2937

.room-id
  font-size 2em
  letter-spacing 2px
  color #2563eb
  background #eff6ff
  padding 10px
  border-radius 4px
  margin 10px 0

.buttons
  display flex
  flex-direction column
  gap 15px
  margin-top 20px

.btn
  padding 12px 20px
  font-size 1.1em
  border none
  border-radius 4px
  cursor pointer
  transition background 0.2s

.btn.primary
  background-color #2563eb
  color white
.btn.primary:hover
  background-color #1d4ed8

.btn.secondary
  background-color #e5e7eb
  color #374151
.btn.secondary:hover
  background-color #d1d5db

.btn.start-btn
  width 100%
  background-color #10b981
  color white
  font-size 1.2em
  margin-top 20px
.btn.start-btn:disabled
  background-color #9ca3af
  cursor not-allowed

.btn.back
  margin-top 15px
  background transparent
  color #6b7280
  text-decoration underline

.input-field
  width 100%
  padding 12px
  font-size 1.2em
  border 1px solid #d1d5db
  border-radius 4px
  margin-bottom 15px
  box-sizing border-box
  text-transform uppercase
</style>
