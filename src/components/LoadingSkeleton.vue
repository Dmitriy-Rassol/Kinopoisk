<template>
  <div
    class="loading-placeholder"
    :class="'loading-' + variant"
    role="status"
    aria-label="Загрузка содержимого"
    aria-busy="true"
  >
    <div
      v-if="variant === 'movie' || variant === 'person'"
      aria-hidden="true"
    >
      <div class="detail-grid">
        <div><div class="skeleton detail-poster"></div></div>
        <div class="skeleton-copy">
          <div class="skeleton skeleton-line skeleton-short"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-line skeleton-half"></div>
          <template v-if="variant === 'movie'">
            <div class="skeleton-inline skeleton-section">
              <div class="skeleton skeleton-score"></div>
              <div class="skeleton skeleton-score"></div>
            </div>
            <div class="skeleton-paragraph">
              <div
                v-for="i in 4"
                :key="i"
                class="skeleton skeleton-line"
                :class="{ 'skeleton-half': i === 4 }"
              ></div>
            </div>
            <div class="skeleton skeleton-button"></div>
          </template>
          <div class="skeleton skeleton-subtitle skeleton-section"></div>
          <div class="skeleton-facts">
            <template
              v-for="i in variant === 'movie' ? 5 : 4"
              :key="i"
            >
              <div class="skeleton skeleton-line"></div>
              <div
                class="skeleton skeleton-line"
                :class="{ 'skeleton-half': i % 2 === 0 }"
              ></div>
            </template>
          </div>
        </div>
      </div>
      <div
        v-if="variant === 'person'"
        class="filmography"
      >
        <div class="skeleton skeleton-subtitle"></div>
        <div class="skeleton skeleton-input"></div>
        <div
          v-for="i in 5"
          :key="i"
          class="search-result-row skeleton-film-row"
        >
          <div class="skeleton skeleton-film-poster"></div>
          <div class="skeleton-row-copy">
            <div class="skeleton skeleton-line skeleton-half"></div>
            <div class="skeleton skeleton-line skeleton-short"></div>
          </div>
          <div class="skeleton skeleton-year"></div>
          <div class="skeleton skeleton-rating"></div>
        </div>
      </div>
    </div>
    <div
      v-else-if="variant === 'cards'"
      class="movie-grid"
      aria-hidden="true"
    >
      <div
        v-for="i in count"
        :key="i"
        class="movie-card"
      >
        <div class="skeleton skeleton-poster"></div>
        <div class="skeleton skeleton-line skeleton-card-title"></div>
        <div class="skeleton skeleton-line skeleton-half"></div>
      </div>
    </div>
    <div
      v-else-if="variant === 'filmography'"
      class="filmography-list"
      aria-hidden="true"
    >
      <div
        v-for="i in count"
        :key="i"
        class="search-result-row skeleton-film-row"
      >
        <div class="skeleton skeleton-film-poster"></div>
        <div class="skeleton-row-copy">
          <div class="skeleton skeleton-line skeleton-half"></div>
          <div class="skeleton skeleton-line skeleton-short"></div>
        </div>
        <div class="skeleton skeleton-year"></div>
        <div class="skeleton skeleton-rating"></div>
      </div>
    </div>
    <div
      v-else-if="variant === 'search'"
      aria-hidden="true"
    >
      <div
        v-for="i in count"
        :key="i"
        class="suggestion-row"
      >
        <div class="skeleton skeleton-search-photo"></div>
        <div class="skeleton-row-copy">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line skeleton-half"></div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="skeleton-hero-copy"
      aria-hidden="true"
    >
      <div class="skeleton skeleton-line skeleton-short"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line skeleton-half"></div>
      <div class="skeleton-paragraph">
        <div
          v-for="i in 3"
          :key="i"
          class="skeleton skeleton-line"
          :class="{ 'skeleton-half': i === 3 }"
        ></div>
      </div>
      <div class="skeleton-inline">
        <div class="skeleton skeleton-button"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'movie' | 'person' | 'cards' | 'filmography' | 'search' | 'hero'
    count?: number
  }>(),
  { variant: 'cards', count: 10 },
)
</script>
