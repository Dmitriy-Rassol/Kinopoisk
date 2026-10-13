<script setup lang="ts">
import { ref, watch } from 'vue'
import { personName, type Person } from '../api'
const props = defineProps<{ person: Person }>()
const broken = ref(false)
watch(() => props.person.id, () => broken.value = false)
</script>
<template><article class="movie-card"><RouterLink :to="`/person/${person.id}`" :aria-label="personName(person)"><div class="poster-wrap"><img v-if="person.photo && !broken" :src="person.photo" :alt="personName(person)" loading="lazy" @error="broken = true"><div v-else class="poster-placeholder">{{ personName(person).charAt(0) }}<span>Фото пока отсутствует</span></div></div><span class="movie-title">{{ personName(person) }}</span></RouterLink><p>{{ person.enName || 'Персона кино' }}</p></article></template>
