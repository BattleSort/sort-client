import Vue from "vue";
import Notifications from "vue-notification";
import App from "./App.vue";
import router from "./router";
import "./registerServiceWorker";
import Vuex from "vuex";
import PeerManager from "./network/PeerManager";

const peerManager = new PeerManager();
Vue.prototype.$peerManager = peerManager;
Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    user: {
      id: ""
    }
  },
  mutations: {
    setUserId(state, payload) {
      state.user.id = payload.user_id;
    },
    deleteSubscriptions(state) {
      // state.cable.subscriptions.subscriptions.forEach(function(e) {
      //   state.cable.subscriptions.remove(e);
      // });
    }
  },
  getters: {
    user_id(state) {
      return state.user.id;
    }
  }
});

Vue.config.productionTip = false;
Vue.use(Notifications);
// console.log(process.env.VUE_APP_ACTION_CABLE_URL);
// TODO: production では console.log出さない的な設定
new Vue({
  router,
  render: h => h(App),
  store
}).$mount("#app");
