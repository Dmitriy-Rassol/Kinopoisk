<script setup lang="ts">
import { useWatchlist } from './stores/watchlist'
const saved = useWatchlist()
</script>
<template>
  <header class="header"><RouterLink to="/" class="brand"><span class="brand-icon">К</span>кинотека<span class="brand-dot">.</span></RouterLink><nav aria-label="Главная навигация"><RouterLink to="/">Фильмы и сериалы</RouterLink><RouterLink to="/watchlist">Буду смотреть <span class="count">{{ saved.movies.length }}</span></RouterLink></nav><span class="header-caption">Хорошее кино начинается здесь</span></header>
  <main><p v-if="saved.storageError" class="notice" role="status">{{ saved.storageError }}</p><RouterView /></main>
  <footer><RouterLink class="brand" to="/">кинотека.</RouterLink><span>Ваш путеводитель в мире кино</span><a href="https://poiskkino.dev/" target="_blank" rel="noopener noreferrer">Данные PoiskKino ↗</a></footer>
</template>
