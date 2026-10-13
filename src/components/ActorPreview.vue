<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'
import { getPerson, type Person } from '../api'

const props = defineProps<{ person: { id: number; name?: string; enName?: string; photo?: string } }>()
const id = useId()
const anchor = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const open = ref(false)
const loading = ref(false)
const failed = ref(false)
const broken = ref(false)
const details = ref<Person>()
const position = ref({ left: '0px', top: '0px' })
const name = computed(() => details.value?.name || props.person.name || props.person.enName || 'Актёр')
const photo = computed(() => details.value?.photo || props.person.photo)
const films = computed(() => [...new Map((details.value?.movies || []).filter(movie => movie.name || movie.alternativeName).map(movie => [movie.id, movie])).values()].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3))
const birthday = computed(() => {
  if (!details.value?.birthday) return ''
  const date = new Date(details.value.birthday)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
})
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

function place() {
  const rect = anchor.value?.getBoundingClientRect()
  const card = panel.value
  if (!rect || !card) return
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - card.offsetWidth - 12))
  const below = rect.bottom + 10
  const top = below + card.offsetHeight <= window.innerHeight - 12 ? below : Math.max(12, rect.top - card.offsetHeight - 10)
  position.value = { left: left + 'px', top: top + 'px' }
}
async function load() {
  if (details.value || loading.value) return
  controller = new AbortController()
  loading.value = true
  failed.value = false
  try { details.value = await getPerson(String(props.person.id), controller.signal) }
  catch { if (!controller.signal.aborted) failed.value = true }
  finally { loading.value = false; await nextTick(); if (open.value) place() }
}
function keep() { clearTimeout(hideTimer) }
function reveal() {
  clearTimeout(showTimer)
  keep()
  showTimer = setTimeout(async () => {
    open.value = true
    void load()
    await nextTick()
    place()
  }, 180)
}
function close() {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  open.value = false
}
function leave() {
  clearTimeout(showTimer)
  hideTimer = setTimeout(() => {
    const focused = document.activeElement
    if (focused && (anchor.value?.contains(focused) || panel.value?.contains(focused))) return
    close()
  }, 160)
}
function focusout(event: FocusEvent) {
  const target = event.relatedTarget
  if (target instanceof Node && (anchor.value?.contains(target) || panel.value?.contains(target))) return
  leave()
}
function escape(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    if (panel.value?.contains(document.activeElement)) anchor.value?.querySelector('a')?.focus()
    close()
  }
}
function outside(event: PointerEvent) {
  if (event.target instanceof Node && !anchor.value?.contains(event.target) && !panel.value?.contains(event.target)) close()
}
function scroll(event: Event) {
  if (event.target instanceof Node && panel.value?.contains(event.target)) return
  close()
}
document.addEventListener('keydown', escape)
document.addEventListener('pointerdown', outside)
window.addEventListener('resize', close)
window.addEventListener('scroll', scroll, true)
onBeforeUnmount(() => {
  close()
  controller?.abort()
  document.removeEventListener('keydown', escape)
  document.removeEventListener('pointerdown', outside)
  window.removeEventListener('resize', close)
  window.removeEventListener('scroll', scroll, true)
})
</script>

<template>
  <span ref="anchor" class="actor-preview" @mouseenter="reveal" @mouseleave="leave" @focusin="reveal" @focusout="focusout">
    <RouterLink :to="'/person/' + person.id" :aria-expanded="open" :aria-controls="open ? id : undefined" @click="close">{{ person.name || person.enName }}</RouterLink>
  </span>
  <Teleport to="body">
    <section v-if="open" :id="id" ref="panel" class="actor-popover" :style="position" :aria-label="name"
      @mouseenter="keep" @mouseleave="leave" @focusin="keep" @focusout="focusout">
      <div class="actor-popover-header">
        <RouterLink :to="'/person/' + person.id" tabindex="-1" aria-hidden="true" @click="close">
          <img v-if="photo && !broken" :src="photo" alt="" @error="broken = true">
          <div v-else class="actor-photo-placeholder">{{ name.charAt(0) }}</div>
        </RouterLink>
        <div>
          <RouterLink class="actor-popover-name" :to="'/person/' + person.id" @click="close">{{ name }}</RouterLink>
          <p v-if="details?.enName || person.enName" class="actor-original-name">{{ details?.enName || person.enName }}</p>
          <p v-if="details?.profession?.length">{{ details.profession.slice(0, 3).map(item => item.value).join(', ') }}</p>
        </div>
      </div>
      <div v-if="loading" class="loading-placeholder actor-popover-loading" role="status" aria-label="Загрузка информации об актёре" aria-busy="true">
        <div aria-hidden="true" class="skeleton-paragraph"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-half"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-half"></div></div>
      </div>
      <template v-else-if="details">
        <p v-if="birthday" class="actor-birthday">{{ birthday }}</p>
        <p v-if="details.birthPlace?.length" class="actor-birthplace">{{ details.birthPlace.map(item => item.value).join(', ') }}</p>
        <div v-if="films.length" class="actor-known-for">
          <h3>Известные фильмы</h3>
          <RouterLink v-for="film in films" :key="film.id" :to="'/movie/' + film.id" @click="close">{{ film.name || film.alternativeName }}</RouterLink>
        </div>
      </template>
      <div v-else-if="failed" class="actor-preview-error"><p>Не удалось получить информацию.</p><button type="button" @click="load">Повторить</button></div>
      <RouterLink class="actor-profile-link" :to="'/person/' + person.id" @click="close">Профиль и фильмография</RouterLink>
    </section>
  </Teleport>
</template>
