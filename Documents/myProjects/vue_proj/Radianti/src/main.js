import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from "vue-router"

import Home from './comps/home-page.vue'
import FrontRedir from './comps/front/redirect.vue'
import Front from './comps/front/front-end.vue'
import Back from './comps/back-end.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/detail/redirect', component: FrontRedir },
    { path: '/detail/front', component: Front },
    { path: '/detail/back', component: Back },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')