import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Movie } from '../api'
export const useWatchlist = defineStore('watchlist', () => {
  const movies = ref<Movie[]>([])
  const storageError = ref('')
  try { const saved: unknown = JSON.parse(localStorage.getItem('kinoteka.watchlist') || '[]'); if (Array.isArray(saved)) movies.value = saved.filter((m): m is Movie => !!m && typeof m === 'object' && typeof m.id === 'number') } catch { storageError.value = 'Не удалось прочитать сохранённый список.' }
  watch(movies, value => { try { localStorage.setItem('kinoteka.watchlist', JSON.stringify(value)); storageError.value = '' } catch { storageError.value = 'Браузер не разрешил сохранить список. Изменения доступны до перезагрузки.' } }, { deep: true })
  const has = (id: number) => movies.value.some(m => m.id === id)
  function toggle(movie: Movie) { if (has(movie.id)) movies.value = movies.value.filter(m => m.id !== movie.id); else movies.value.push(movie) }
  return { movies, has, toggle, storageError }
})
