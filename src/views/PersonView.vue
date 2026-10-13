<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { errorMessage, getPerson, personName, plainText, type Person } from '../api'
const route = useRoute()
const person = ref<Person>()
const loading = ref(false), error = ref(''), broken = ref(false)
const filmQuery = ref(''), actingOnly = ref(false), shown = ref(20)
const films = computed(() => {
  const filtered = (person.value?.movies || []).filter(movie => (!actingOnly.value || movie.enProfession === 'actor') && `${movie.name || ''} ${movie.alternativeName || ''}`.toLowerCase().includes(filmQuery.value.trim().toLowerCase()))
  return [...new Map(filtered.map(movie => [movie.id, movie])).values()].sort((a, b) => (b.rating || 0) - (a.rating || 0))
})
const facts = computed(() => person.value?.facts?.map(fact => plainText(fact.value)).filter(Boolean) || [])
watch([filmQuery, actingOnly], () => shown.value = 20)
function date(value?: string) { if (!value) return '—'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) }
let controller: AbortController | undefined
async function load() {
  controller?.abort(); const current = new AbortController(); controller = current
  loading.value = true; error.value = ''; person.value = undefined; broken.value = false; shown.value = 20; filmQuery.value = ''; actingOnly.value = false
  try { const data = await getPerson(String(route.params.id), current.signal); if (!current.signal.aborted) person.value = data }
  catch (e) { if (!current.signal.aborted) error.value = errorMessage(e).replace('Фильм не найден.', 'Персона не найдена.') }
  finally { if (!current.signal.aborted) loading.value = false }
}
watch(() => route.params.id, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>
<template>
<section class="detail">
  <RouterLink class="back" to="/">← В каталог</RouterLink>
  <div v-if="loading" class="empty" role="status">Загружаем страницу персоны…</div>
  <div v-else-if="error" class="empty" role="alert"><h2>{{ error }}</h2><button class="primary" @click="load">Повторить</button></div>
  <template v-else-if="person">
    <div class="detail-grid"><div><img v-if="person.photo && !broken" class="detail-poster" :src="person.photo" :alt="personName(person)" @error="broken = true"><div v-else class="poster-placeholder detail-poster">{{ personName(person).charAt(0) }}</div></div>
    <div><span class="eyebrow">ЛЮДИ, КОТОРЫЕ СОЗДАЮТ КИНО</span><h1>{{ personName(person) }}</h1><p class="muted">{{ person.enName }}</p><h2>Биография</h2>
      <dl><dt>Карьера</dt><dd>{{ person.profession?.map(p => p.value).join(', ') || '—' }}</dd><dt>Дата рождения</dt><dd>{{ date(person.birthday) }}</dd><template v-if="person.death"><dt>Дата смерти</dt><dd>{{ date(person.death) }}</dd></template><dt>Место рождения</dt><dd>{{ person.birthPlace?.map(p => p.value).join(', ') || '—' }}</dd><template v-if="person.growth"><dt>Рост</dt><dd>{{ person.growth }} см</dd></template></dl>
      <details v-if="facts.length" class="person-facts"><summary>Факты из жизни · {{ facts.length }}</summary><p v-for="(fact, index) in facts" :key="index">{{ fact }}</p></details>
    </div></div>
    <section class="filmography"><h2>Фильмография <span class="muted">· {{ films.length }}</span></h2><div class="filmography-filters"><input v-model="filmQuery" type="search" placeholder="Найти фильм в фильмографии" aria-label="Поиск в фильмографии"><label><input v-model="actingOnly" type="checkbox"> Только актёрские роли</label></div><p class="muted">Сначала фильмы с высоким рейтингом</p>
      <div v-if="!films.length" class="empty"><p>{{ person.movies?.length ? 'Нет фильмов по выбранным условиям.' : 'Фильмография пока не добавлена.' }}</p></div>
      <div v-else class="filmography-list"><RouterLink v-for="movie in films.slice(0, shown)" :key="movie.id" :to="`/movie/${movie.id}`" class="filmography-row"><div><strong>{{ movie.name || movie.alternativeName || 'Без названия' }}</strong><p v-if="movie.description">{{ plainText(movie.description) }}</p></div><span class="film-score">{{ movie.rating ? movie.rating.toFixed(1) : '—' }}</span><span aria-hidden="true">↗</span></RouterLink></div><button v-if="shown < films.length" class="primary show-more" @click="shown += 20">Показать ещё</button>
    </section>
  </template>
</section>
</template>
