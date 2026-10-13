<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getMovie, errorMessage, title, type Movie } from '../api'
import { useWatchlist } from '../stores/watchlist'
const route = useRoute(), saved = useWatchlist()
const movie = ref<Movie>(), loading = ref(true), error = ref(''), broken = ref(false)
const actors = computed(() => movie.value?.persons?.filter(p => p.enProfession === 'actor').slice(0, 12) || [])
let controller: AbortController | undefined
async function load() { controller?.abort(); const current = new AbortController(); controller = current; loading.value = true; error.value = ''; movie.value = undefined; broken.value = false
  try { const result = await getMovie(String(route.params.id), current.signal); if (!current.signal.aborted) movie.value = result } catch(e) { if (!current.signal.aborted) error.value = errorMessage(e) } finally { if (!current.signal.aborted) loading.value = false }
}
watch(() => route.params.id, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>
<template><section class="detail"><RouterLink class="back" to="/">← В каталог</RouterLink><div v-if="loading" class="empty" role="status">Загружаем историю…</div><div v-else-if="error" class="empty" role="alert"><h2>{{ error }}</h2><button class="primary" @click="load">Повторить</button></div><template v-else-if="movie"><div class="detail-grid"><div><img v-if="movie.poster?.url && !broken" class="detail-poster" :src="movie.poster.url" :alt="title(movie)" @error="broken = true"><div v-else class="poster-placeholder detail-poster">К</div></div><div><span class="eyebrow">{{ movie.type === 'tv-series' ? 'СЕРИАЛ' : 'ФИЛЬМ' }} · {{ movie.year }}</span><h1>{{ title(movie) }}</h1><p class="muted">{{ movie.alternativeName }} <span v-if="movie.ageRating != null">· {{ movie.ageRating }}+</span></p><div class="detail-ratings"><span v-if="movie.rating?.kp"><b>{{ movie.rating.kp.toFixed(1) }}</b> Кинопоиск</span><span v-if="movie.rating?.imdb"><b>{{ movie.rating.imdb.toFixed(1) }}</b> IMDb</span></div><p class="description">{{ movie.description || movie.shortDescription || 'Описание пока не добавлено.' }}</p><button class="primary" :aria-pressed="saved.has(movie.id)" @click="saved.toggle(movie)">{{ saved.has(movie.id) ? '✓ В вашем списке' : '+ Буду смотреть' }}</button><h2>О фильме</h2><dl><dt>Год производства</dt><dd>{{ movie.year || '—' }}</dd><dt>Страна</dt><dd>{{ movie.countries?.map(c => c.name).join(', ') || '—' }}</dd><dt>Жанр</dt><dd>{{ movie.genres?.map(g => g.name).join(', ') || '—' }}</dd><dt>Режиссёр</dt><dd>{{ movie.persons?.filter(p => p.enProfession === 'director').map(p => p.name || p.enName).join(', ') || '—' }}</dd><dt>Продолжительность</dt><dd>{{ movie.movieLength ? `${movie.movieLength} мин.` : '—' }}</dd></dl><template v-if="actors.length"><h2>В главных ролях</h2><div class="actors"><RouterLink v-for="person in actors" :key="person.id" :to="`/person/${person.id}`">{{ person.name || person.enName }} ↗</RouterLink></div></template></div></div></template></section></template>

