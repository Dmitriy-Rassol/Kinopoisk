<script setup lang="ts">
import { useWatchlist } from '../stores/watchlist'
import MovieCard from '../components/MovieCard.vue'
const saved = useWatchlist()
</script>
<template><section class="catalog saved-page"><span class="eyebrow">ЛИЧНАЯ КОЛЛЕКЦИЯ</span><h1>Буду смотреть<span class="orange">.</span></h1><p class="muted">Сохранённые истории для подходящего момента.</p><div v-if="saved.movies.length" class="movie-grid"><MovieCard v-for="movie in saved.movies" :key="movie.id" :movie="movie" /></div><div v-else class="empty"><h2>Здесь будет ваше любимое кино</h2><p>Нажмите «+» на карточке, чтобы сохранить фильм.</p><RouterLink to="/" class="primary">Найти фильм ↗</RouterLink></div></section></template>
