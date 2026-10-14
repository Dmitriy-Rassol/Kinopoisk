<template>
  <div
    class="quick-search"
    @focusout="blur"
    @keydown.esc="close"
  >
    <form
      class="search"
      role="search"
      @submit.prevent="submit"
    >
      <span aria-hidden="true">⌕</span
      ><input
        v-model="query"
        role="combobox"
        aria-label="Поиск фильмов и актёров"
        aria-autocomplete="list"
        :aria-expanded="visible"
        aria-controls="search-suggestions"
        :aria-activedescendant="active >= 0 ? 'suggestion-' + active : undefined"
        autocomplete="off"
        placeholder="Фильмы, сериалы, актёры…"
        type="search"
        @input="open = true"
        @focus="open = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
      /><button type="submit">Найти</button>
    </form>
    <div
      v-if="visible"
      class="suggestions"
    >
      <LoadingSkeleton
        v-if="loading"
        variant="search"
        :count="4"
      />
      <p
        v-if="message"
        class="suggestion-message"
        role="status"
      >
        {{ message }}
      </p>
      <div
        id="search-suggestions"
        role="listbox"
        aria-label="Подсказки поиска"
      >
        <template
          v-for="(item, index) in items"
          :key="item.key"
        >
          <div
            v-if="index === 0 || items[index - 1]?.kind !== item.kind"
            class="suggestion-heading"
            role="presentation"
          >
            {{ item.kind }}
          </div>
          <RouterLink
            :id="'suggestion-' + index"
            :to="item.url"
            role="option"
            :aria-selected="active === index"
            class="suggestion-row"
            :class="{ selected: active === index }"
            @click="close"
          >
            <div class="suggestion-photo">
              <img
                v-if="item.image"
                :src="item.image"
                alt=""
                @error="hideImage"
              /><span v-else>{{ item.label.charAt(0) }}</span>
            </div>
            <div>
              <strong>{{ item.label }}</strong
              ><small>{{ item.detail }}</small>
            </div>
          </RouterLink>
        </template>
      </div>
      <p
        v-if="!loading && !items.length && !message"
        class="suggestion-message"
      >
        Ничего не найдено. Попробуйте другое название или имя.
      </p>
      <button
        type="button"
        class="all-results"
        @click="showAllResults"
      >
        Все результаты поиска →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchMovies, searchPeople, title, personName } from '@/api'
const route = useRoute(),
  router = useRouter()
const query = ref(String(route.query.q || '')),
  open = ref(false),
  loading = ref(false),
  message = ref(''),
  active = ref(-1)
interface Suggestion {
  key: string
  label: string
  detail: string
  image?: string
  url: string
  kind: string
}
const items = ref<Suggestion[]>([])
const visible = computed(() => open.value && query.value.trim().length >= 2)
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
function close() {
  open.value = false
  active.value = -1
}
function submit() {
  if (visible.value && active.value >= 0 && items.value[active.value]) {
    void router.push(items.value[active.value]!.url)
    close()
    return
  }
  close()
  void router.push({ path: '/', query: { q: query.value.trim() || undefined } })
}
function showAllResults() {
  active.value = -1
  submit()
}
function move(direction: number) {
  open.value = true
  if (items.value.length)
    active.value = (active.value + direction + items.value.length) % items.value.length
}
watch(query, (value) => {
  clearTimeout(timer)
  controller?.abort()
  items.value = []
  active.value = -1
  message.value = ''
  loading.value = false
  if (value.trim().length < 2) return
  loading.value = true
  timer = setTimeout(async () => {
    const current = new AbortController()
    controller = current
    const [movies, people] = await Promise.allSettled([
      searchMovies(value.trim(), 1, current.signal),
      searchPeople(value.trim(), 1, current.signal),
    ])
    if (current.signal.aborted) return
    const found: Suggestion[] = []
    if (movies.status === 'fulfilled')
      found.push(
        ...movies.value.docs.slice(0, 4).map((movie) => ({
          key: 'movie-' + movie.id,
          label: title(movie),
          detail: [
            movie.year,
            movie.alternativeName,
            movie.rating?.kp ? '★ ' + movie.rating.kp.toFixed(1) : '',
          ]
            .filter(Boolean)
            .join(' · '),
          image: movie.poster?.previewUrl || movie.poster?.url,
          url: '/movie/' + movie.id,
          kind: 'Фильмы и сериалы',
        })),
      )
    if (people.status === 'fulfilled')
      found.push(
        ...people.value.docs.slice(0, 4).map((person) => ({
          key: 'person-' + person.id,
          label: personName(person),
          detail: person.enName || 'Персона кино',
          image: person.photo,
          url: '/person/' + person.id,
          kind: 'Актёры и персоны',
        })),
      )
    items.value = found
    loading.value = false
    if (movies.status === 'rejected' || people.status === 'rejected')
      message.value = 'Часть подсказок недоступна. Попробуйте поиск ещё раз.'
  }, 350)
})
watch(
  () => route.fullPath,
  () => {
    close()
    query.value = String(route.query.q || '')
  },
)
onBeforeUnmount(() => {
  clearTimeout(timer)
  controller?.abort()
})
function blur(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) close()
}
function hideImage(event: Event) {
  ;(event.target as HTMLImageElement).style.visibility = 'hidden'
}
</script>
