import { createApp } from "vue";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";
import "./variables.css";

const routes = [
  // home-page.vue is directly inside /comps/
  { path: "/", component: () => import("./comps/home-page.vue") },

  // front-end.vue is inside /comps/front/
  {
    path: "/detail/front",
    component: () => import("./comps/front/front-end.vue"),
  },

  // admin-panel.vue and back-end.vue are inside /comps/back/
  {
    path: "/detail/back",
    component: () => import("./comps/back/admin-panel.vue"),
  },
  {
    path: "/detail/back/main",
    component: () => import("./comps/back/back-end.vue"),
  },

  // team-assign.vue is also inside /comps/back/
  {
    path: "/detail/teamassign",
    component: () => import("./comps/back/team-assign.vue"),
  },

  // user-dashboard.vue — logged-in users track their own requests
  {
    path: "/detail/my-requests",
    component: () => import("./comps/user-dashboard.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount("#app");