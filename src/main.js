import Vue from "vue";
import Notifications from "vue-notification";
import App from "./App.vue";
import router from "./router";
import "./registerServiceWorker";
import Vuex from "vuex";

import ActionCable from "actioncable";
const cable = ActionCable.createConsumer(process.env.VUE_APP_ACTION_CABLE_URL);
Vue.prototype.$cable = cable;

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
    }
  },
  getters: {
    getUserId(state) {
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
