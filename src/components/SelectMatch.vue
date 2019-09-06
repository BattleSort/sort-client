<template>
  <div>
    <div v-bind:class="{ hide: !beforeSelect }">
      <h1>カテゴリーとレベル</h1>
      <button
        v-on:click="waitMatch(match)"
        class="element"
        v-for="match in matches"
        :key="match.id"
      >
        {{ match.level + "×" + match.category }}
      </button>
    </div>
    <div v-bind:class="{ hide: beforeSelect }">
      <p>マッチング中</p>
      <div class="loader">
        <div class="line-scale-pulse-out-rapid">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "loaders.css";

export default {
  name: "SelectMatch",
  data: function() {
    return {
      beforeSelect: true,
      matches: [
        {
          id: 1,
          level: 1,
          category: "history"
        },
        {
          id: 2,
          level: 2,
          category: "history"
        }
      ]
    };
  },
  methods: {
    waitMatch: function(match) {
      console.log(match);
      var user_id;
      // TODO: これまでの間に匿名ログイン化、ログインを通して値を入れておきたい
      if (this.$store.getters.user_id) {
        user_id = this.$store.getters.user_id;
      } else {
        user_id = Math.floor(Math.random() * 100) + 1;
        this.$store.getters.user_id = user_id;
      }

      let _this = this;

      // 各ユーザーは一意で推測不可能なidを付与したroomで対戦相手を待ち受ける
      this.$cable.subscriptions.create(
        {
          channel: "MatchChannel",
          level: match.level,
          category: match.category,
          user_id: user_id
        },
        {
          connected() {
            console.log("connected " + user_id);

            // Called when the subscription is ready for use on the server
          },
          disconnected() {
            console.log("disconnected");
            // Called when the subscription has been terminated by the server
          },
          received(data) {
            console.log(data);
            // Called when there's incoming data on the websocket for this channel
            switch (data.type) {
              case "moveRoom":
                _this.$router.push({
                  name: "room",
                  params: { room_id: data.room_id }
                });
                break;
              default:
                break;
            }
          },
          mes(message) {
            this.perform("mes", { message: message });
          }
        }
      );

      // createConsumer.disconnect();

      this.beforeSelect = false;
      // マッチング中
    }
  }
};
</script>

<style lang="stylus" scoped>
.element
  display  block
  margin-bottom 10px
  height 100px
  width 200px
  border 1px solid black
  p
    vertical-align middle
.sortable-chosen
  background-color red

.line-scale-pulse-out-rapid > div
  background-color green

.hide
  display none
</style>
