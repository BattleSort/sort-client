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
// TODO: ログイン実装したらいらんやつかも
import uuid from "uuid/v4";

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
                    var identifier = e.identifier;
                    var obj = JSON.parse(identifier);
                    if (obj.channel == "MatchChannel") {
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
          },
          mes(message) {
            this.perform("mes", { message: message });
          }
        }
      );

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
