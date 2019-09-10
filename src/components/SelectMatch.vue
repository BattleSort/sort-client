<template>
  <div>
    <div :class="{ hide: !beforeSelect }">
      <h2>カテゴリーとレベルを選択</h2>

      <div class="container">
        <template v-for="category in categories">
          <template v-for="level in levels">
            <template v-for="player_count in player_counts">
              <button
                :key="level.id + ' ' + category.id + ' ' + player_count"
                class="element"
                @click="
                  waitMatch({
                    level: level.id,
                    category: category.id,
                    player_count: player_count
                  })
                "
              >
                {{
                  category.name + " " + level.name + " " + player_count + "人用"
                }}
              </button>
            </template>
          </template>
        </template>
      </div>
    </div>
    <div :class="{ hide: beforeSelect }">
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

import axios from "axios";

export default {
  name: "SelectMatch",
  data: function() {
    return {
      beforeSelect: true,
      categories: [],
      levels: [
        { id: 1, name: "簡単" },
        { id: 2, name: "普通" },
        { id: 3, name: "激むず" }
      ],
      player_counts: [1, 2, 4]
    };
  },
  mounted() {
    let _this = this;
    axios
      .get(process.env.VUE_APP_API_URL + "categories")
      //thenで成功した場合
      .then(function(response) {
        _this.categories = response.data;
        _this.createMatches();
      })
      //chachでエラーの挙動を定義
      .catch(function(error) {
        console.log(error);
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
