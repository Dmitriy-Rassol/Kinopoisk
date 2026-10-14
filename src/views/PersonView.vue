<template>
  <section class="detail">
    <RouterLink
      class="back"
      to="/"
      >← В каталог</RouterLink
    >
    <LoadingSkeleton
      v-if="loading"
      variant="person"
    />
    <div
      v-else-if="error"
      class="empty"
      role="alert"
    >
      <h2>{{ error }}</h2>
      <button
        class="primary"
        @click="load"
      >
        Повторить
      </button>
    </div>
    <template v-else-if="person">
      <div class="detail-grid">
        <div>
          <img
            v-if="person.photo && !broken"
            class="detail-poster"
            :src="person.photo"
            :alt="personName(person)"
            @error="broken = true"
          />
          <div
            v-else
            class="poster-placeholder detail-poster"
          >
            {{ personName(person).charAt(0) }}
          </div>
        </div>
        <div>
          <span class="eyebrow">ЛЮДИ, КОТОРЫЕ СОЗДАЮТ КИНО</span>
          <h1>{{ personName(person) }}</h1>
          <p class="muted">{{ person.enName }}</p>
          <h2>Биография</h2>
          <dl>
            <dt>Карьера</dt>
            <dd>{{ person.profession?.map((p) => p.value).join(', ') || '—' }}</dd>
            <dt>Дата рождения</dt>
            <dd>{{ date(person.birthday) }}</dd>
            <template v-if="person.death">
              <dt>Дата смерти</dt>
              <dd>{{ date(person.death) }}</dd>
            </template>
            <dt>Место рождения</dt>
            <dd>{{ person.birthPlace?.map((p) => p.value).join(', ') || '—' }}</dd>
            <template v-if="person.growth">
              <dt>Рост</dt>
              <dd>{{ person.growth }} см</dd>
            </template>
          </dl>
          <details
            v-if="facts.length"
            class="person-facts"
          >
            <summary>Факты из жизни · {{ facts.length }}</summary>
            <p
              v-for="(fact, index) in facts"
              :key="index"
            >
              {{ fact }}
            </p>
          </details>
        </div>
      </div>
      <section class="filmography">
        <h2>
          Фильмография <span class="muted">· {{ films.length }}</span>
        </h2>
        <div class="filmography-filters">
          <input
            v-model="filmQuery"
            type="search"
            placeholder="Найти фильм в фильмографии"
            aria-label="Поиск в фильмографии"
          /><label
            ><input
              v-model="actingOnly"
              type="checkbox"
            />
            Только актёрские роли</label
          >
        </div>
        <FilmographyChart
          v-if="!yearsError"
          :films="films"
          :years="years"
          :loading="yearsLoading"
        />
        <p class="muted">По году выхода: от новых к старым · фильмы без указанного года в конце</p>
        <LoadingSkeleton
          v-if="yearsLoading"
          variant="filmography"
          :count="6"
        />
        <div
          v-else-if="yearsError"
          role="alert"
        >
          <p>{{ yearsError }}</p>
          <button
            class="primary"
            @click="loadYears(controller?.signal)"
          >
            Повторить загрузку фильмографии
          </button>
        </div>
        <div
          v-else-if="!films.length"
          class="empty"
        >
          <p>
            {{
              person.movies?.length
                ? 'Нет фильмов по выбранным условиям.'
                : 'Фильмография пока не добавлена.'
            }}
          </p>
        </div>
        <div
          v-else
          class="search-result-list"
        >
          <RouterLink
            v-for="movie in films.slice(0, shown)"
            :key="movie.id"
            :to="'/movie/' + movie.id"
            class="search-result-row"
          >
            <div class="search-result-photo">
              <img
                v-if="
                  !brokenPosters[movie.id] &&
                  (filmDetails[movie.id]?.poster?.previewUrl || filmDetails[movie.id]?.poster?.url)
                "
                :src="
                  filmDetails[movie.id]?.poster?.previewUrl || filmDetails[movie.id]?.poster?.url
                "
                alt=""
                loading="lazy"
                @error="brokenPosters[movie.id] = true"
              />
              <span v-else>К</span>
            </div>
            <div class="search-result-copy">
              <strong>{{ movie.name || movie.alternativeName || 'Без названия' }}</strong>
              <p>
                {{ years[movie.id] || 'Год неизвестен'
                }}<span v-if="movie.alternativeName && movie.alternativeName !== movie.name">
                  · {{ movie.alternativeName }}</span
                >
              </p>
              <p v-if="filmDetails[movie.id]?.genres?.length">{{ movieGenres(movie.id) }}</p>
              <p v-if="movie.description">{{ plainText(movie.description) }}</p>
            </div>
            <span class="film-score">{{ movie.rating ? movie.rating.toFixed(1) : '—' }}</span>
          </RouterLink>
        </div>
        <button
          v-if="!yearsLoading && !yearsError && shown < films.length"
          class="primary show-more"
          @click="shown += 20"
        >
          Показать ещё
        </button>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import FilmographyChart from '@/components/FilmographyChart.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  errorMessage,
  getPerson,
  getFilmographyMovies,
  personName,
  plainText,
  type Person,
  type Movie,
} from '@/api'
const route = useRoute()
const person = ref<Person>()
const loading = ref(false),
  error = ref(''),
  broken = ref(false)
const years = ref<Record<number, number>>({}),
  yearsLoading = ref(false),
  yearsError = ref('')
const filmDetails = ref<Record<number, Movie>>({})
const brokenPosters = ref<Record<number, boolean>>({})
const filmQuery = ref(''),
  actingOnly = ref(false),
  shown = ref(20)
const films = computed(() => {
  const filtered = (person.value?.movies || []).filter(
    (movie) =>
      (!actingOnly.value || movie.enProfession === 'actor') &&
      `${movie.name || ''} ${movie.alternativeName || ''}`
        .toLowerCase()
        .includes(filmQuery.value.trim().toLowerCase()),
  )
  return [...new Map(filtered.map((movie) => [movie.id, movie])).values()].sort(
    (a, b) =>
      (years.value[b.id] || 0) - (years.value[a.id] || 0) || (b.rating || 0) - (a.rating || 0),
  )
})
function movieGenres(id: number) {
  return filmDetails.value[id]?.genres?.map((item) => item.name).join(', ') || ''
}
const facts = computed(
  () => person.value?.facts?.map((fact) => plainText(fact.value)).filter(Boolean) || [],
)
watch([filmQuery, actingOnly], () => (shown.value = 20))
function date(value?: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
}
let controller: AbortController | undefined
async function loadYears(signal?: AbortSignal) {
  yearsLoading.value = true
  yearsError.value = ''
  try {
    const data = await getFilmographyMovies(
      (person.value?.movies || []).map((movie) => movie.id),
      signal,
    )
    if (!signal?.aborted) {
      filmDetails.value = data
      years.value = Object.fromEntries(
        Object.values(data)
          .filter((movie) => movie.year)
          .map((movie) => [movie.id, movie.year!]),
      )
    }
  } catch (e) {
    if (!signal?.aborted) yearsError.value = errorMessage(e)
  } finally {
    if (!signal?.aborted) yearsLoading.value = false
  }
}
async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  loading.value = true
  error.value = ''
  person.value = undefined
  broken.value = false
  shown.value = 20
  filmQuery.value = ''
  actingOnly.value = false
  years.value = {}
  filmDetails.value = {}
  brokenPosters.value = {}
  yearsError.value = ''
  yearsLoading.value = false
  try {
    const data = await getPerson(String(route.params.id), current.signal)
    if (!current.signal.aborted) {
      person.value = data
      void loadYears(current.signal)
    }
  } catch (e) {
    if (!current.signal.aborted)
      error.value = errorMessage(e).replace('Фильм не найден.', 'Персона не найдена.')
  } finally {
    if (!current.signal.aborted) loading.value = false
  }
}
watch(() => route.params.id, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>
