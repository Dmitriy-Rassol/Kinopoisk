<script setup lang="ts">
import HeartIcon from './HeartIcon.vue'
import { ref, watch } from 'vue'
import { title, type Movie } from '../api'
import { useWatchlist } from '../stores/watchlist'
const props = defineProps<{ movie: Movie }>()
const saved = useWatchlist()
const broken = ref(false)
watch(() => props.movie.id, () => broken.value = false)
</script>
<template>
  <article class="movie-card">
    <div class="poster-wrap">
      <RouterLink :to="`/movie/${movie.id}`" :aria-label="title(movie)">
        <img v-if="movie.poster?.url && !broken" :src="movie.poster.url" :alt="title(movie)" loading="lazy" @error="broken = true">
        <div v-else class="poster-placeholder">К<span>Постер пока отсутствует</span></div>
        <span v-if="movie.rating?.kp" class="rating">{{ movie.rating.kp.toFixed(1) }}</span>
      </RouterLink>
      <button class="save-button" :class="{ saved: saved.has(movie.id) }" :aria-label="saved.has(movie.id) ? 'Убрать из списка' : 'Буду смотреть'" :aria-pressed="saved.has(movie.id)" @click="saved.toggle(movie)"><HeartIcon :filled="saved.has(movie.id)" /></button>
    </div>
    <RouterLink class="movie-title" :to="`/movie/${movie.id}`">{{ title(movie) }}</RouterLink>
    <p>{{ movie.year || 'Год неизвестен' }} <span v-if="movie.genres?.length">· {{ movie.genres[0]?.name }}</span></p>
  </article>
</template>
