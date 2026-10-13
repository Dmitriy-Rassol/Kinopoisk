<script setup lang="ts">
import CustomSelect from '../components/CustomSelect.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMovies, searchMovies, errorMessage, searchPeople, type Person, type Movie } from '../api'
import MovieCard from '../components/MovieCard.vue'
import PersonCard from '../components/PersonCard.vue'
import QuickSearch from '../components/QuickSearch.vue'
import CinemaHero from '../components/CinemaHero.vue'
const genreOptions = [
  { value: '', label: 'Все жанры' },
  ...['драма', 'комедия', 'боевик', 'триллер', 'фантастика', 'фэнтези', 'детектив', 'ужасы', 'приключения', 'мелодрама'].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
]
const sortOptions = [
  { value: 'votes.kp', label: 'По популярности' },
  { value: 'rating.kp', label: 'По рейтингу' },
  { value: 'year', label: 'Сначала новые' },
]
const route = useRoute(), router = useRouter()
const people = ref<Person[]>([]), movies = ref<Movie[]>([])

const loading = ref(false), error = ref(''), peopleError = ref('')
const pages = ref(0), total = ref(0), peoplePages = ref(0), peopleTotal = ref(0)
const validPage = (value: unknown) => { const number = Number(value); return Number.isSafeInteger(number) && number > 0 ? number : 1 }
const page = computed(() => validPage(route.query.page))
const peoplePage = computed(() => validPage(route.query.peoplePage))
const kind = computed(() => String(route.query.type || ''))
const genre = computed(() => String(route.query.genre || ''))
const sort = computed(() => String(route.query.sort || 'votes.kp'))
const searching = computed(() => !!String(route.query.q || '').trim())
let controller: AbortController | undefined
function update(values: Record<string, string | undefined>) { router.push({ path: '/', query: { ...route.query, page: undefined, peoplePage: undefined, scope: undefined, ...values } }) }
function paginate(key: 'page' | 'peoplePage', value: number) { router.push({ path: '/', query: { ...route.query, scope: undefined, [key]: String(value) } }) }

async function load() {
  controller?.abort(); const current = new AbortController(); controller = current
  loading.value = true; error.value = ''; peopleError.value = ''; movies.value = []; people.value = []
  pages.value = 0; total.value = 0; peoplePages.value = 0; peopleTotal.value = 0
  try {
    if (searching.value) {
      const [films, persons] = await Promise.allSettled([
        searchMovies(String(route.query.q), page.value, current.signal),
        searchPeople(String(route.query.q), peoplePage.value, current.signal),
      ])
      if (current.signal.aborted) return
      if (films.status === 'fulfilled') { movies.value = films.value.docs; pages.value = films.value.pages; total.value = films.value.total }
      else error.value = errorMessage(films.reason)
      if (persons.status === 'fulfilled') { people.value = persons.value.docs; peoplePages.value = persons.value.pages; peopleTotal.value = persons.value.total }
      else peopleError.value = errorMessage(persons.reason)
      return
    }
    const params: Record<string, string | number> = { page: page.value, limit: 20, sortField: sort.value, sortType: -1, notNullFields: 'name' }
    if (kind.value) params.type = kind.value
    if (genre.value) params['genres.name'] = genre.value
    const data = await getMovies(params, current.signal)
    if (!current.signal.aborted) { movies.value = data.docs; pages.value = data.pages; total.value = data.total }
  } catch (e) { if (!current.signal.aborted) error.value = errorMessage(e) }
  finally { if (!current.signal.aborted) loading.value = false }
}
watch(() => route.query, () => { void load() }, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>
<template>
  <section class="discovery"><div><h1>Фильмы и сериалы</h1></div><div class="discovery-search"><QuickSearch /></div></section>
  <CinemaHero v-if="!searching" />
  <section v-if="!searching" class="collections" aria-label="Жанры"><span>Что посмотреть</span><RouterLink :to="{ path: '/', query: { genre: 'фантастика' }, hash: '#catalog' }">Фантастика</RouterLink><RouterLink :to="{ path: '/', query: { genre: 'триллер' }, hash: '#catalog' }">Триллеры</RouterLink><RouterLink :to="{ path: '/', query: { genre: 'комедия' }, hash: '#catalog' }">Комедии</RouterLink></section>
  <section id="catalog" class="catalog"><div class="section-heading"><div><h2>{{ searching ? `Поиск: «${route.query.q}»` : 'Популярные фильмы' }}</h2></div><span v-if="!loading && !error && !peopleError" class="muted">{{ (total + peopleTotal).toLocaleString('ru-RU') }} результатов</span></div>
    <div v-if="!searching" class="filters"><div class="tabs"><button v-for="tab in [{ label: 'Всё', value: '' }, { label: 'Фильмы', value: 'movie' }, { label: 'Сериалы', value: 'tv-series' }, { label: 'Мультфильмы', value: 'cartoon' }]" :key="tab.value" :class="{ active: kind === tab.value }" :aria-pressed="kind === tab.value" @click="update({ type: tab.value || undefined })">{{ tab.label }}</button></div><div class="selects"><CustomSelect :model-value="genre" label="Жанр" :options="genreOptions" @update:model-value="update({ genre: $event || undefined })" /><CustomSelect :model-value="sort" label="Сортировка" :options="sortOptions" @update:model-value="update({ sort: $event })" /></div></div>
    <button v-else-if="searching" class="text-button" @click="update({ q: undefined, scope: undefined })">← Вернуться к каталогу</button>

    <div v-if="loading"><LoadingSkeleton variant="cards" :count="20" /><section v-if="searching" class="people-results"><h2>Актёры и персоны</h2><LoadingSkeleton variant="cards" :count="5" /></section></div>
    <template v-else>
      <section aria-label="Фильмы и сериалы">
        <h2 v-if="searching">Фильмы и сериалы <span v-if="!error" class="muted">· {{ total.toLocaleString('ru-RU') }}</span></h2>
        <div v-if="error" class="empty" role="alert"><p>{{ error }}</p><button class="primary" @click="load">Попробовать снова</button></div>
        <div v-else-if="!movies.length" class="empty"><h3>Фильмы не найдены</h3><p>Попробуйте другое название или измените фильтры.</p></div>
        <div v-else class="movie-grid"><MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" /></div>
        <div v-if="!error && pages > 1" class="pagination" aria-label="Страницы фильмов"><button :disabled="page <= 1" @click="paginate('page', page - 1)">← Назад</button><span>{{ page }} / {{ pages }}</span><button :disabled="page >= pages" @click="paginate('page', page + 1)">Далее →</button></div>
      </section>
      <section v-if="searching" class="people-results" aria-label="Актёры и персоны">
        <h2>Актёры и персоны <span v-if="!peopleError" class="muted">· {{ peopleTotal.toLocaleString('ru-RU') }}</span></h2>
        <div v-if="peopleError" class="empty" role="alert"><p>{{ peopleError }}</p><button class="primary" @click="load">Повторить поиск</button></div>
        <div v-else-if="!people.length" class="empty"><h3>Персоны не найдены</h3><p>Попробуйте указать полное имя актёра или режиссёра.</p></div>
        <div v-else class="movie-grid"><PersonCard v-for="person in people" :key="person.id" :person="person" /></div>
        <div v-if="!peopleError && peoplePages > 1" class="pagination" aria-label="Страницы персон"><button :disabled="peoplePage <= 1" @click="paginate('peoplePage', peoplePage - 1)">← Назад</button><span>{{ peoplePage }} / {{ peoplePages }}</span><button :disabled="peoplePage >= peoplePages" @click="paginate('peoplePage', peoplePage + 1)">Далее →</button></div>
      </section>
    </template>
  </section>
</template>
