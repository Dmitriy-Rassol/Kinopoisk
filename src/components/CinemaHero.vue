<script setup lang="ts">
import LoadingSkeleton from './LoadingSkeleton.vue'
import HeartIcon from './HeartIcon.vue'
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { getMovie, title, type Movie } from '../api'
import { useWatchlist } from '../stores/watchlist'
const root = ref<HTMLElement>(), movies = ref<Movie[]>([]), selected = ref(0), failed = ref(false), loading = ref(true)
const current = computed(() => movies.value[selected.value])
const saved = useWatchlist()
const controller = new AbortController()
let motion: gsap.MatchMedia | undefined
function animate() {
  motion?.revert(); motion = gsap.matchMedia()
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('.spotlight-copy > *', { y: 22, autoAlpha: 0, stagger: .065, duration: .65, ease: 'power3.out', clearProps: 'all' })
    gsap.from('.spotlight-image', { scale: 1.035, opacity: .3, duration: 1.1, ease: 'power2.out', clearProps: 'all' })
  }, root.value)
}
watch(selected, async () => { failed.value = false; await nextTick(); animate() })
onMounted(async () => {
  const results = await Promise.allSettled([getMovie('258687', controller.signal), getMovie('447301', controller.signal), getMovie('535341', controller.signal)])
  if (controller.signal.aborted) return
  movies.value = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  loading.value = false; await nextTick(); animate()
})
onBeforeUnmount(() => { controller.abort(); motion?.revert() })
</script>
<template>
<section ref="root" class="spotlight" aria-label="Выбор кинотеки">
  <img v-if="current && !failed && (current.backdrop?.url || current.poster?.url)" :key="current.id" class="spotlight-image" :src="current.backdrop?.url || current.poster?.url" alt="" fetchpriority="high" @error="failed = true">
  <div class="spotlight-shade"></div>
  <div class="spotlight-top"><span><i></i> ВЫБОР КИНОТЕКИ</span><span>ФИЛЬМЫ И СЕРИАЛЫ</span></div>
  <LoadingSkeleton v-if="loading" variant="hero" /><div v-else class="spotlight-copy">
    <span class="eyebrow">Рекомендуем</span>
    <h1>{{ current ? title(current) : 'Что посмотреть' }}</h1>
    <div v-if="current" class="spotlight-meta"><b v-if="current.rating?.kp">★ {{ current.rating.kp.toFixed(1) }}</b><span>{{ current.year }}</span><span>{{ current.genres?.slice(0, 2).map(g => g.name).join(' / ') }}</span><span v-if="current.movieLength">{{ current.movieLength }} мин.</span></div>
    <p>{{ current?.shortDescription || current?.description?.slice(0, 210) || 'Выбирайте фильмы и сохраняйте их в список «Буду смотреть».' }}</p>
    <div class="spotlight-actions"><RouterLink v-if="current" :to="`/movie/${current.id}`" class="primary">О фильме</RouterLink><a v-else href="#catalog" class="primary">Открыть каталог</a><button v-if="current" class="secondary" :aria-pressed="saved.has(current.id)" @click="saved.toggle(current)"><HeartIcon :filled="saved.has(current.id)" />{{ saved.has(current.id) ? 'В списке' : 'Буду смотреть' }}</button></div>
  </div>
  <div class="spotlight-bottom"><span class="spotlight-caption"></span><div class="spotlight-pager"><button v-for="(movie, index) in movies" :key="movie.id" :class="{ active: selected === index }" :aria-label="title(movie)" :aria-pressed="selected === index" @click="selected = index"><span>0{{ index + 1 }}</span><i></i></button></div></div>
</section>
</template>
