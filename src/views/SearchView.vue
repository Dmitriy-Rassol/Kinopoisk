<template>
  <section class="discovery">
    <h1>
      {{
        mode === 'movies' ? 'Фильмы и сериалы' : mode === 'people' ? 'Актёры и персоны' : 'Поиск'
      }}
    </h1>
    <QuickSearch />
  </section>
  <section class="catalog search-results">
    <RouterLink
      v-if="mode !== 'all'"
      class="back"
      :to="{ path: '/', query: { q: query } }"
      >← Все результаты поиска</RouterLink
    >
    <h2>
      {{
        query ? 'Результаты по запросу «' + query + '»' : 'Введите название фильма или имя актёра'
      }}
    </h2>
    <template v-if="query">
      <section
        v-if="mode !== 'people'"
        aria-label="Фильмы и сериалы"
      >
        <h3>
          Фильмы и сериалы
          <span
            v-if="!moviesLoading && !moviesError"
            class="muted"
            >· {{ movieTotal.toLocaleString('ru-RU') }}</span
          >
        </h3>
        <LoadingSkeleton
          v-if="moviesLoading"
          :variant="mode === 'all' ? 'search' : 'cards'"
          :count="mode === 'all' ? 8 : 30"
        />
        <div
          v-else-if="moviesError"
          class="empty"
          role="alert"
        >
          <p>{{ moviesError }}</p>
          <button
            class="primary"
            @click="load"
          >
            Повторить
          </button>
        </div>
        <p
          v-else-if="!movies.length"
          class="muted"
        >
          Фильмы не найдены. Попробуйте другой запрос.
        </p>
        <template v-else>
          <div
            v-if="mode === 'all'"
            class="search-result-list"
          >
            <RouterLink
              v-for="movie in movies"
              :key="movie.id"
              :to="'/movie/' + movie.id"
              class="search-result-row"
            >
              <div class="search-result-photo">
                <img
                  v-if="movie.poster?.previewUrl || movie.poster?.url"
                  :src="movie.poster.previewUrl || movie.poster.url"
                  alt=""
                  loading="lazy"
                  @error="hideImage"
                /><span v-else>К</span>
              </div>
              <div class="search-result-copy">
                <strong>{{ title(movie) }}</strong>
                <p>
                  {{ movie.year || 'Год неизвестен'
                  }}<span v-if="movie.alternativeName"> · {{ movie.alternativeName }}</span>
                </p>
                <p v-if="movie.genres?.length">
                  {{ movie.genres.map((item) => item.name).join(', ') }}
                </p>
              </div>
              <span
                v-if="movie.rating?.kp"
                class="film-score"
                >{{ movie.rating.kp.toFixed(1) }}</span
              >
            </RouterLink>
          </div>
          <div
            v-else
            class="movie-grid"
          >
            <MovieCard
              v-for="movie in movies"
              :key="movie.id"
              :movie="movie"
            />
          </div>
          <RouterLink
            v-if="mode === 'all'"
            class="search-more"
            :to="{ path: '/search/movies', query: { q: query } }"
            >Показать все результаты — фильмы и сериалы</RouterLink
          >
        </template>
      </section>
      <section
        v-if="mode !== 'movies'"
        :class="{ 'people-results': mode === 'all' }"
        aria-label="Актёры и персоны"
      >
        <h3>
          Актёры и персоны
          <span
            v-if="!peopleLoading && !peopleError"
            class="muted"
            >· {{ peopleTotal.toLocaleString('ru-RU') }}</span
          >
        </h3>
        <LoadingSkeleton
          v-if="peopleLoading && !people.length"
          :variant="mode === 'all' ? 'search' : 'cards'"
          :count="mode === 'all' ? 8 : 30"
        />
        <div
          v-if="peopleError"
          class="empty"
          role="alert"
        >
          <p>{{ peopleError }}</p>
          <button
            class="primary"
            @click="load"
          >
            Повторить
          </button>
        </div>
        <p
          v-else-if="!peopleLoading && !people.length"
          class="muted"
        >
          Персоны не найдены. Попробуйте другое имя.
        </p>
        <template v-if="people.length">
          <div
            v-if="mode === 'all'"
            class="search-result-list"
          >
            <RouterLink
              v-for="person in people"
              :key="person.id"
              :to="'/person/' + person.id"
              class="search-result-row"
            >
              <div class="search-result-photo">
                <img
                  v-if="person.photo"
                  :src="person.photo"
                  alt=""
                  loading="lazy"
                  @error="hideImage"
                /><span v-else>{{ personName(person).charAt(0) }}</span>
              </div>
              <div class="search-result-copy">
                <strong>{{ personName(person) }}</strong>
                <p v-if="person.enName">{{ person.enName }}</p>
                <p v-if="person.profession?.length">
                  {{ person.profession.map((item) => item.value).join(', ') }}
                </p>
              </div>
            </RouterLink>
          </div>
          <div
            v-else
            class="movie-grid"
          >
            <PersonCard
              v-for="person in people"
              :key="person.id"
              :person="person"
            />
          </div>
          <LoadingSkeleton
            v-if="peopleLoading"
            variant="search"
            :count="3"
          />
          <RouterLink
            v-if="mode === 'all'"
            class="search-more"
            :to="{ path: '/search/people', query: { q: query } }"
            >Показать всех актёров</RouterLink
          >
        </template>
      </section>
      <PaginationNav
        v-if="mode !== 'all' && !moviesLoading && !peopleLoading && !moviesError && !peopleError"
        :page="page"
        :pages="pages"
        @change="paginate"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import PaginationNav from '@/components/PaginationNav.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  searchMovies,
  searchPeople,
  errorMessage,
  title,
  personName,
  type Movie,
  type Person,
} from '@/api'
import QuickSearch from '@/components/QuickSearch.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import MovieCard from '@/components/MovieCard.vue'
import PersonCard from '@/components/PersonCard.vue'
const route = useRoute(),
  router = useRouter()
const query = computed(() => String(route.query.q || '').trim())
const mode = computed(() =>
  route.path === '/search/movies' ? 'movies' : route.path === '/search/people' ? 'people' : 'all',
)
const page = computed(() => {
  const n = Number(route.query.page)
  return Number.isSafeInteger(n) && n > 0 ? n : 1
})
const movies = ref<Movie[]>([]),
  people = ref<Person[]>([])
const moviesLoading = ref(false),
  peopleLoading = ref(false)
const moviesError = ref(''),
  peopleError = ref('')
const movieTotal = ref(0),
  peopleTotal = ref(0),
  pages = ref(0)
let controller: AbortController | undefined
async function loadMovies(signal: AbortSignal) {
  moviesLoading.value = true
  try {
    const data = await searchMovies(query.value, mode.value === 'all' ? 1 : page.value, signal, 30)
    if (signal.aborted) return
    movies.value = data.docs.slice(0, 30)
    movieTotal.value = data.total
    if (mode.value === 'movies') pages.value = data.pages
  } catch (e) {
    if (!signal.aborted) moviesError.value = errorMessage(e)
  } finally {
    if (!signal.aborted) moviesLoading.value = false
  }
}
async function loadPeople(signal: AbortSignal) {
  peopleLoading.value = true
  try {
    // Keep requests small enough for the existing API and stop at the overview cap.
    const overview = mode.value === 'all'
    const first = await searchPeople(query.value, overview ? 1 : page.value, signal, 30)
    if (signal.aborted) return
    people.value = first.docs
    peopleTotal.value = first.total
    if (!overview) {
      pages.value = first.pages
      return
    }
    const unique = new Map(first.docs.map((person) => [person.id, person]))
    for (let next = 2; next <= first.pages && unique.size < 230; next++) {
      const data = await searchPeople(query.value, next, signal, 30)
      if (signal.aborted) return
      for (const person of data.docs) unique.set(person.id, person)
      people.value = [...unique.values()].slice(0, 230)
      if (!data.docs.length) break
    }
  } catch (e) {
    if (!signal.aborted) peopleError.value = errorMessage(e)
  } finally {
    if (!signal.aborted) peopleLoading.value = false
  }
}
function load() {
  controller?.abort()
  controller = new AbortController()
  movies.value = []
  people.value = []
  movieTotal.value = 0
  peopleTotal.value = 0
  pages.value = 0
  moviesError.value = ''
  peopleError.value = ''
  moviesLoading.value = false
  peopleLoading.value = false
  if (!query.value) return
  if (mode.value !== 'people') void loadMovies(controller.signal)
  if (mode.value !== 'movies') void loadPeople(controller.signal)
}
function paginate(value: number) {
  void router.push({ path: route.path, query: { q: query.value, page: String(value) } })
}
function hideImage(event: Event) {
  ;(event.target as HTMLImageElement).style.visibility = 'hidden'
}
watch(() => [query.value, mode.value, page.value], load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>
