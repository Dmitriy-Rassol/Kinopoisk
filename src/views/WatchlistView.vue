<script setup lang="ts">
import { useWatchlist } from '../stores/watchlist'
import MovieCard from '../components/MovieCard.vue'
const saved = useWatchlist()
</script>
<template><section class="catalog saved-page"><span class="eyebrow">ЛИЧНАЯ КОЛЛЕКЦИЯ</span><h1>Буду смотреть</h1><p class="muted">Фильмы и сериалы, которые вы сохранили.</p><div v-if="saved.movies.length" class="movie-grid"><MovieCard v-for="movie in saved.movies" :key="movie.id" :movie="movie" /></div><div v-else class="empty"><h2>Здесь будет ваше любимое кино</h2><p>Нажмите на сердечко на карточке, чтобы добавить фильм в список.</p><RouterLink to="/" class="primary">Найти фильм</RouterLink></div></section></template>
