<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useWatchlist } from './stores/watchlist'
import HeartIcon from './components/HeartIcon.vue'
const saved = useWatchlist()
const route = useRoute()
</script>
<template>
  <a class="skip-link" href="#main">К содержимому</a>
  <header class="header">
    <RouterLink to="/" class="brand">кинотека</RouterLink>
    <nav aria-label="Главная навигация">
      <RouterLink to="/" :class="{ current: route.path === '/' && !route.query.type }">Главная</RouterLink>
      <RouterLink :to="{ path: '/', query: { type: 'movie' } }" :class="{ current: route.path === '/' && route.query.type === 'movie' }">Фильмы</RouterLink>
      <RouterLink :to="{ path: '/', query: { type: 'tv-series' } }" :class="{ current: route.path === '/' && route.query.type === 'tv-series' }">Сериалы</RouterLink>
    </nav>
    <RouterLink to="/watchlist" class="header-library"><HeartIcon :filled="route.path === '/watchlist'" />Буду смотреть <span class="count">{{ saved.movies.length }}</span></RouterLink>
  </header>
  <main id="main"><p v-if="saved.storageError" class="notice" role="status">{{ saved.storageError }}</p><RouterView /></main>
  <footer><RouterLink class="brand" to="/">кинотека</RouterLink><span>Фильмы, сериалы и люди кино</span><a href="https://poiskkino.dev/" target="_blank" rel="noopener noreferrer">Данные PoiskKino</a></footer>
</template>
