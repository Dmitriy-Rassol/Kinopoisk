import { createRouter, createWebHistory } from 'vue-router'
export default createRouter({ history: createWebHistory(), scrollBehavior: (to, from, savedPosition) => {
  if (savedPosition) return savedPosition
  if (to.path === from.path) return false
  return { top: 0 }
}, routes: [
  { path: '/', component: () => import('./views/CatalogView.vue') },
  { path: '/movie/:id', component: () => import('./views/MovieView.vue') },
  { path: '/person/:id', component: () => import('./views/PersonView.vue') },
  { path: '/watchlist', component: () => import('./views/WatchlistView.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('./views/NotFoundView.vue') },
] })


