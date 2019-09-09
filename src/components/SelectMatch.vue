<template>
  <div>
    <div v-bind:class="{ hide: !beforeSelect }">
      <h2>カテゴリーとレベルを選択</h2>
      <div class="container">
        <button
          v-on:click="waitMatch(match)"
          class="element"
          v-for="(match, index) in matches"
          :key="index"
        >
          {{ 難易度[match.level - 1] + " " + match.player_count + "人用" }}
        </button>
      </div>
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
// TODO: ログイン実装したらいらんやつかも
import uuid from "uuid/v4";

export default {
  name: "SelectMatch",
  data: function() {
    return {
      beforeSelect: true,
      // TODO: これらをサーバーから持ってくる
      難易度: ["簡単", "普通", "激むず"],
      matches: []
    };
  },
  mounted() {
    let _this = this;
    [1, 2, 3].forEach(function(level) {
      [1, 2, 3, 4].forEach(function(player_count) {
        _this.matches.push({
          level: level,
          player_count: player_count,
          category: "all"
        });
      });
    });
  },
  methods: {
    waitMatch: function(match) {
      // FIXME: コネクションを全削除
      this.$store.commit("deleteSubscriptions");
      console.log(match);
      var user_id;
      // TODO: これまでの間に匿名ログイン化、ログインを通して値を入れておきたい
      if (this.$store.getters.user_id) {
        user_id = this.$store.getters.user_id;
      } else {
        user_id = uuid();
        this.$store.commit("setUserId", { user_id: user_id });
      }
      console.log(this);

      let _this = this;
      // 各ユーザーは一意で推測不可能なidを付与したroomで対戦相手を待ち受ける
      this.$store.getters.cable.subscriptions.create(
        {
          channel: "MatchChannel",
          level: match.level,
          category: match.category,
          player_count: match.player_count,
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
                // 不要なコネクションの削除
                _this.$store.getters.cable.subscriptions.subscriptions.forEach(
                  function(e) {
                    if (JSON.parse(e.identifier).channel == "MatchChannel") {
                      _this.$store.getters.cable.subscriptions.remove(e);
                    }
                  }
                );
                _this.$router.push({
                  name: "room",
                  params: { room_id: data.room_id }
                });
                break;
              default:
                break;
            }
          }
        }
      );
      this.beforeSelect = false;
    }
  }
};
</script>

<style lang="stylus" scoped>
.container
  display flex
  flex-wrap: wrap
  justify-content space-around
  align-content space-around
.element
  display  block
  margin-bottom 10px
  height 60px
  width 200px
  border 1px solid dae3eb
  background-color aliceblue
.line-scale-pulse-out-rapid > div
  background-color green
.hide
  display none
</style>
