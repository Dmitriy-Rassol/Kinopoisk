import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
export default createRouter({
  history:
    import.meta.env.VITE_ROUTER_MODE === 'hash'
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition
    if (to.hash === '#catalog') return { el: '#catalog', top: 24 }
    if (to.path.startsWith('/search/') && to.query.page !== from.query.page) return { top: 0 }
    if (to.path === from.path) return false
    return { top: 0 }
  },
  routes: [
    { path: '/', component: () => import('@/views/CatalogView.vue') },
    { path: '/search/movies', component: () => import('@/views/SearchView.vue') },
    { path: '/search/people', component: () => import('@/views/SearchView.vue') },
    { path: '/movie/:id', component: () => import('@/views/MovieView.vue') },
    { path: '/person/:id', component: () => import('@/views/PersonView.vue') },
    { path: '/watchlist', component: () => import('@/views/WatchlistView.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
})
