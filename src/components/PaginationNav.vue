<template>
  <nav
    v-if="pages > 1"
    class="pagination numbered-pagination"
    :aria-label="label"
  >
    <button
      type="button"
      class="page-direction"
      :disabled="current <= 1"
      @click="select(current - 1)"
    >
      ← Назад
    </button>
    <div class="page-numbers">
      <template
        v-for="item in items"
        :key="item"
      >
        <button
          v-if="typeof item === 'number'"
          type="button"
          :class="{ 'current-page': item === current }"
          :aria-label="'Страница ' + item"
          :aria-current="item === current ? 'page' : undefined"
          @click="select(item)"
        >
          {{ item }}
        </button>
        <span
          v-else
          class="page-gap"
          aria-hidden="true"
          >…</span
        >
      </template>
    </div>
    <button
      type="button"
      class="page-direction"
      :disabled="current >= pages"
      @click="select(current + 1)"
    >
      Далее →
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ page: number; pages: number; label?: string }>(), {
  label: 'Страницы результатов',
})
const emit = defineEmits<{ change: [page: number] }>()
const current = computed(() => Math.min(Math.max(1, props.page), props.pages))
const items = computed(() => {
  const total = props.pages
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const start = Math.max(2, Math.min(current.value - 1, total - 4))
  const end = Math.min(total - 1, Math.max(current.value + 1, 5))
  const result: (number | string)[] = [1]
  if (start > 2) result.push('before')
  for (let value = start; value <= end; value++) result.push(value)
  if (end < total - 1) result.push('after')
  result.push(total)
  return result
})
function select(page: number) {
  if (page >= 1 && page <= props.pages && page !== props.page) emit('change', page)
}
</script>
