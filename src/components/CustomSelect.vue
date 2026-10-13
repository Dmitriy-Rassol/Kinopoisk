<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  label: string
  options: { value: string; label: string }[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const open = ref(false)
const active = ref(0)
const id = useId()
const selected = computed(() => props.options.findIndex(option => option.value === props.modelValue))
const caption = computed(() => props.options[selected.value]?.label || props.label)
let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined

function reveal() {
  open.value = true
  active.value = Math.max(0, selected.value)
  scrollActive()
}
function scrollActive() {
  void nextTick(() => root.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }))
}
function choose(index: number) {
  const option = props.options[index]
  if (!option) return
  emit('update:modelValue', option.value)
  open.value = false
  trigger.value?.focus()
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Tab') { open.value = false; return }
  if (event.key === 'Escape') {
    if (open.value) { event.preventDefault(); event.stopPropagation(); open.value = false }
    return
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (open.value) choose(active.value)
    else reveal()
    return
  }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    if (!open.value) reveal()
    else if (event.key === 'ArrowDown') active.value = Math.min(active.value + 1, props.options.length - 1)
    else if (event.key === 'ArrowUp') active.value = Math.max(active.value - 1, 0)
    if (event.key === 'Home') active.value = 0
    if (event.key === 'End') active.value = props.options.length - 1
    scrollActive()
    return
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    if (!open.value) reveal()
    clearTimeout(typedTimer)
    typed += event.key.toLocaleLowerCase('ru-RU')
    const match = props.options.findIndex(option => option.label.toLocaleLowerCase('ru-RU').startsWith(typed))
    if (match >= 0) { active.value = match; scrollActive() }
    typedTimer = setTimeout(() => { typed = '' }, 600)
  }
}
function outside(event: PointerEvent) {
  if (event.target instanceof Node && !root.value?.contains(event.target)) open.value = false
}
function blur(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node) || !root.value?.contains(event.relatedTarget)) open.value = false
}
watch(() => props.modelValue, () => { open.value = false })
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => { document.removeEventListener('pointerdown', outside); clearTimeout(typedTimer) })
</script>

<template>
  <div ref="root" class="custom-select" @focusout="blur">
    <button ref="trigger" type="button" class="select-trigger" role="combobox"
      :aria-label="label" :aria-expanded="open" :aria-controls="id" aria-haspopup="listbox"
      :aria-activedescendant="open && options[active] ? id + '-' + active : undefined"
      @click="open ? open = false : reveal()" @keydown="keydown">
      <span>{{ caption }}</span>
      <svg class="select-chevron" :class="{ expanded: open }" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <div v-if="open" :id="id" class="select-menu" role="listbox" :aria-label="label">
      <div v-for="(option, index) in options" :id="id + '-' + index" :key="option.value"
        class="select-option" :class="{ selected: modelValue === option.value, active: active === index }"
        role="option" :aria-selected="modelValue === option.value" :data-active="active === index"
        @pointermove="active = index" @mousedown.prevent @click="choose(index)">
        <span>{{ option.label }}</span>
        <svg v-if="modelValue === option.value" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </div>
    </div>
  </div>
</template>
