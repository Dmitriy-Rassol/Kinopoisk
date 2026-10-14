<template>
  <section
    class="career-chart"
    aria-label="Статистика фильмографии"
  >
    <div class="career-chart-heading">
      <h3>Фильмография по годам</h3>
      <div
        class="career-chart-modes"
        aria-label="Показатель графика"
      >
        <button
          type="button"
          :aria-pressed="mode === 'count'"
          @click="mode = 'count'"
        >
          Количество фильмов
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'rating'"
          @click="mode = 'rating'"
        >
          Средний рейтинг
        </button>
      </div>
    </div>
    <div
      v-if="loading"
      class="loading-placeholder"
      role="status"
      aria-label="Загрузка графика"
      aria-busy="true"
    >
      <div
        class="chart-skeleton"
        aria-hidden="true"
      >
        <div
          v-for="i in 18"
          :key="i"
          class="skeleton"
          :style="{ height: 30 + ((i * 37) % 65) + '%' }"
        ></div>
      </div>
    </div>
    <template v-else-if="series.length">
      <p
        class="chart-reading"
        aria-live="polite"
      >
        {{ selected ? describe(selected) : '' }}
      </p>
      <div class="chart-frame">
        <div
          class="chart-axis"
          aria-hidden="true"
        >
          <span>{{ max }}</span
          ><span>{{ mode === 'rating' ? 5 : Math.round(max / 2) }}</span
          ><span>0</span>
        </div>
        <div class="chart-scroll">
          <div
            class="chart-columns"
            :style="{ minWidth: Math.max(300, series.length * 24) + 'px' }"
          >
            <button
              v-for="(item, index) in series"
              :key="item.year"
              type="button"
              class="chart-column"
              :aria-label="describe(item)"
              :title="describe(item)"
              @mouseenter="hovered = item.year"
              @mouseleave="hovered = undefined"
              @focus="hovered = item.year"
              @blur="hovered = undefined"
              @click="hovered = item.year"
            >
              <span class="chart-bar-track"
                ><span
                  class="chart-bar"
                  :style="{ height: (value(item) / max) * 100 + '%' }"
                ></span
              ></span>
              <span
                class="chart-year"
                aria-hidden="true"
                >{{
                  index === 0 || index === series.length - 1 || item.year % 5 === 0 ? item.year : ''
                }}</span
              >
            </button>
          </div>
        </div>
      </div>
      <p class="chart-note">
        {{
          mode === 'count'
            ? 'Уникальные фильмы и сериалы по году выхода.'
            : 'Средний рейтинг фильмов с оценками; без оценок — пропуск.'
        }}<span v-if="missing"> Без года выхода: {{ missing }} — не включены в график.</span>
      </p>
    </template>
    <p
      v-else
      class="muted"
    >
      Нет данных по годам для построения графика.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{
  films: { id: number; rating?: number }[]
  years: Record<number, number>
  loading?: boolean
}>()
const mode = ref<'count' | 'rating'>('count')
const hovered = ref<number>()
const series = computed(() => {
  const groups = new Map<number, { count: number; ratings: number[] }>()
  for (const film of props.films) {
    const year = props.years[film.id]
    if (!year || !Number.isInteger(year)) continue
    const group = groups.get(year) || { count: 0, ratings: [] }
    group.count++
    if (film.rating && film.rating > 0 && film.rating <= 10) group.ratings.push(film.rating)
    groups.set(year, group)
  }
  const dates = [...groups.keys()].sort((a, b) => a - b)
  if (!dates.length) return []
  return Array.from({ length: dates[dates.length - 1]! - dates[0]! + 1 }, (_, index) => {
    const year = dates[0]! + index
    const group = groups.get(year)
    return {
      year,
      count: group?.count || 0,
      rated: group?.ratings.length || 0,
      rating: group?.ratings.length
        ? group.ratings.reduce((sum, rating) => sum + rating, 0) / group.ratings.length
        : null,
    }
  })
})
const max = computed(() =>
  mode.value === 'rating' ? 10 : Math.max(1, ...series.value.map((item) => item.count)),
)
const missing = computed(() => props.films.filter((film) => !props.years[film.id]).length)
const selected = computed(() => series.value.find((item) => item.year === hovered.value))
function value(item: (typeof series.value)[number]) {
  return mode.value === 'count' ? item.count : item.rating || 0
}
function describe(item: (typeof series.value)[number]) {
  return mode.value === 'count'
    ? item.year + ': фильмов — ' + item.count
    : item.year +
        ': ' +
        (item.rating === null
          ? 'нет оценок'
          : 'средний рейтинг ' + item.rating.toFixed(1) + ', с оценками — ' + item.rated)
}
</script>
