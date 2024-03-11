import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { defineAsyncComponent } from 'vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    name: 'Index',
    redirect: '/home',
    component: defineAsyncComponent(() => import(/* webpackChunkName: "base" */ '../views/index.vue')),
    children: [
      {
        path: '/home',
        name: 'Home',
        component: defineAsyncComponent(() => import(/* webpackChunkName: "base" */ '../views/home.vue')),
      },
      {
        path: '/us/annual-report',
        name: 'USAnnualReport',
        component: defineAsyncComponent(
          () => import(/* webpackChunkName: "base" */ '../views/us/annual-report/index.vue'),
        ),
      },
      {
        path: '/a/annual-report',
        name: 'AAnnualReport',
        component: defineAsyncComponent(
          () => import(/* webpackChunkName: "base" */ '../views/a/annual-report/index.vue'),
        ),
      },
      {
        path: '/download/task',
        name: 'DownloadTask',
        component: defineAsyncComponent(
          () => import(/* webpackChunkName: "base" */ '../views/download/task/index.vue'),
        ),
      },
      {
        path: '/convert/pdf',
        name: 'ConvertPdf',
        component: defineAsyncComponent(() => import(/* webpackChunkName: "base" */ '../views/convert/pdf/index.vue')),
      },
      {
        path: '/convert/task',
        name: 'ConvertTask',
        component: defineAsyncComponent(() => import(/* webpackChunkName: "base" */ '../views/convert/task/index.vue')),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
