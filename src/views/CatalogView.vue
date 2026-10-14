<template>
  <SearchView v-if="searching" />
  <template v-else>
    <section class="discovery">
      <div><h1>Фильмы и сериалы</h1></div>
      <div class="discovery-search"><QuickSearch /></div>
    </section>
    <CinemaHero v-if="!searching" />
    <section
      v-if="!searching"
      class="collections"
      aria-label="Жанры"
    >
      <span>Что посмотреть</span
      ><RouterLink :to="{ path: '/', query: { genre: 'фантастика' }, hash: '#catalog' }"
        >Фантастика</RouterLink
      ><RouterLink :to="{ path: '/', query: { genre: 'триллер' }, hash: '#catalog' }"
        >Триллеры</RouterLink
      ><RouterLink :to="{ path: '/', query: { genre: 'комедия' }, hash: '#catalog' }"
        >Комедии</RouterLink
      >
    </section>
    <section
      id="catalog"
      class="catalog"
    >
      <div class="section-heading">
        <div>
          <h2>{{ searching ? `Поиск: «${route.query.q}»` : 'Популярные фильмы' }}</h2>
        </div>
        <span
          v-if="!loading && !error"
          class="muted"
          >{{ total.toLocaleString('ru-RU') }} результатов</span
        >
      </div>
      <div
        v-if="!searching"
        class="filters"
      >
        <div class="tabs">
          <button
            v-for="tab in [
              { label: 'Всё', value: '' },
              { label: 'Фильмы', value: 'movie' },
              { label: 'Сериалы', value: 'tv-series' },
              { label: 'Мультфильмы', value: 'cartoon' },
            ]"
            :key="tab.value"
            :class="{ active: kind === tab.value }"
            :aria-pressed="kind === tab.value"
            @click="update({ type: tab.value || undefined })"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="selects">
          <CustomSelect
            :model-value="genre"
            label="Жанр"
            :options="genreOptions"
            @update:model-value="update({ genre: $event || undefined })"
          /><CustomSelect
            :model-value="sort"
            label="Сортировка"
            :options="sortOptions"
            @update:model-value="update({ sort: $event })"
          />
        </div>
      </div>
      <button
        v-else-if="searching"
        class="text-button"
        @click="update({ q: undefined, scope: undefined })"
      >
        ← Вернуться к каталогу
      </button>

      <div v-if="loading">
        <LoadingSkeleton
          variant="cards"
          :count="20"
        />
      </div>
      <template v-else>
        <section aria-label="Фильмы и сериалы">
          <h2 v-if="searching">
            Фильмы и сериалы
            <span
              v-if="!error"
              class="muted"
              >· {{ total.toLocaleString('ru-RU') }}</span
            >
          </h2>
          <div
            v-if="error"
            class="empty"
            role="alert"
          >
            <p>{{ error }}</p>
            <button
              class="primary"
              @click="load"
            >
              Попробовать снова
            </button>
          </div>
          <div
            v-else-if="!movies.length"
            class="empty"
          >
            <h3>Фильмы не найдены</h3>
            <p>Попробуйте другое название или измените фильтры.</p>
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
          <PaginationNav
            v-if="!error"
            :page="page"
            :pages="pages"
            label="Страницы фильмов"
            @change="paginate('page', $event)"
          />
        </section>
      </template>
    </section>
  </template>
</template>

<script setup lang="ts">
import PaginationNav from '@/components/PaginationNav.vue'
import SearchView from '@/views/SearchView.vue'
import CustomSelect from '@/components/CustomSelect.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMovies, errorMessage, type Movie } from '@/api'
import MovieCard from '@/components/MovieCard.vue'

import QuickSearch from '@/components/QuickSearch.vue'
import CinemaHero from '@/components/CinemaHero.vue'
const genreOptions = [
  { value: '', label: 'Все жанры' },
  ...[
    'драма',
    'комедия',
    'боевик',
    'триллер',
    'фантастика',
    'фэнтези',
    'детектив',
    'ужасы',
    'приключения',
    'мелодрама',
  ].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
]
const sortOptions = [
  { value: 'votes.kp', label: 'По популярности' },
  { value: 'rating.kp', label: 'По рейтингу' },
  { value: 'year', label: 'Сначала новые' },
]
const route = useRoute(),
  router = useRouter()
const movies = ref<Movie[]>([])

const loading = ref(false),
  error = ref('')
const pages = ref(0),
  total = ref(0)
const validPage = (value: unknown) => {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : 1
}
const page = computed(() => validPage(route.query.page))
const kind = computed(() => String(route.query.type || ''))
const genre = computed(() => String(route.query.genre || ''))
const sort = computed(() => String(route.query.sort || 'votes.kp'))
const searching = computed(() => !!String(route.query.q || '').trim())
let controller: AbortController | undefined
function update(values: Record<string, string | undefined>) {
  router.push({
    path: '/',
    query: { ...route.query, page: undefined, peoplePage: undefined, scope: undefined, ...values },
  })
}
function paginate(key: 'page' | 'peoplePage', value: number) {
  router.push({ path: '/', query: { ...route.query, scope: undefined, [key]: String(value) } })
}

async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  loading.value = true
  error.value = ''
  movies.value = []
  pages.value = 0
  total.value = 0
  try {
    if (searching.value) {
      return
    }
    const params: Record<string, string | number> = {
      page: page.value,
      limit: 20,
      sortField: sort.value,
      sortType: -1,
      notNullFields: 'name',
    }
    if (kind.value) params.type = kind.value
    if (genre.value) params['genres.name'] = genre.value
    const data = await getMovies(params, current.signal)
    if (!current.signal.aborted) {
      movies.value = data.docs
      pages.value = data.pages
      total.value = data.total
    }
  } catch (e) {
    if (!current.signal.aborted) error.value = errorMessage(e)
  } finally {
    if (!current.signal.aborted) loading.value = false
  }
}
watch(
  () => route.query,
  () => {
    void load()
  },
  { immediate: true },
)
onBeforeUnmount(() => controller?.abort())
</script>
