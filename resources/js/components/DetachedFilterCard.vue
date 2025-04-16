<template>
  <card id="o1-detached-card" class="flex flex-col h-auto relative o1-min-h-0 o1-overflow-visible">
    <div
      v-if="hasAnyActions"
      class="o1-flex o1-justify-end overflow-hidden"
      :class="{
        'rounded-lg': isCollapsed,
        'o1-rounded-t-lg  border-b border-gray-200 dark:border-gray-600': !isCollapsed,
      }"
    >
      <ActionButton v-if="card.withReset" @click="clearAllFilters()">
        <ResetIcon />
      </ActionButton>

      <ActionButton @click="toggleIsPersisting" v-if="card.persistFilters">
        <LockIcon
          :class="{
            'text-green-500 opacity-100': isPersisting,
            'text-gray-400 opacity-80 hover:opacity-100': !isPersisting,
          }"
        />
      </ActionButton>

      <ActionButton v-if="card.withToggle" @click="toggleIsCollapsed">
        <CollapseIcon :class="{ 'o1-rotate-90': isCollapsed, 'o1-rotate-[270deg]': !isCollapsed }" />
      </ActionButton>
    </div>

    <div class="px-3 py-4 max-h-screen opacity-100 w-full" :class="{ hidden: isCollapsed }">
      <!-- Tabs header -->
      <div v-if="hasTabs" class="w-full mb-3 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
        <nav class="flex flex-nowrap text-sm font-medium">
          <button
            v-for="(tab, index) in tabGroups"
            :key="'tab-' + index"
            class="mr-4 px-4 py-2 border-b-2 whitespace-nowrap relative"
            :class="{
              'border-blue-500 text-blue-600 font-semibold bg-white shadow-md rounded-t': activeTab === index,
              'border-transparent text-gray-500 hover:text-gray-700': activeTab !== index,
            }"
            @click="activeTab = index"
          >
            {{ tab.name }}
            <span
              v-if="card.meta?.showFilterBadge !== false && countActiveFilters(tab.filters) > 0"
              class="absolute top-0 right-0 mt-0.5 mr-1.5 bg-red-500 text-white text-xs leading-tight font-semibold rounded-full px-1.5"
            >
              {{ countActiveFilters(tab.filters) }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Filters grouped in tabs -->
      <template v-if="hasTabs">
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          v-for="(group, i) in tabGroups"
          v-show="i === activeTab"
          :key="'tab-content-' + i"
        >
          <div class="w-full" v-for="filter in group.filters" :key="filter.key">
            <nova-detached-filter
              :width="'w-full'"
              :filter="filter"
              :resource-name="resourceName"
              @handle-filter-changed="handleFilterChanged"
              @reset-filter="resetFilter"
            />
          </div>
        </div>
      </template>

      <!-- Default filters layout (no tabs) -->
      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div class="w-full" v-for="item in card.filters" :key="item.key">
            <!-- Single Filter -->
            <nova-detached-filter
              v-if="isFilterComponent(item)"
              :width="'w-full'"
              :filter="item"
              :resource-name="resourceName"
              @handle-filter-changed="handleFilterChanged"
              @reset-filter="resetFilter"
            />

            <!-- Filter Column -->
            <nova-detached-filter
              v-else
              v-for="filter in item.filters"
              v-bind:key="filter.key"
              :width="'w-full'"
              :filter="filter"
              :resource-name="resourceName"
              @handle-filter-changed="handleFilterChanged"
              @reset-filter="resetFilter"
            />
          </div>
        </div>
      </template>
    </div>
  </card>
</template>

<script>
import { RouteParameters } from '../mixins';
import InteractsWithQueryString from 'laravel-nova-mixins/InteractsWithQueryString';
import PerPageable from 'laravel-nova-mixins/PerPageable';
import Filterable from 'laravel-nova-mixins/Filterable';
import ActionButton from './ActionButton';
import { LockIcon, ResetIcon, CollapseIcon } from './icons';

export default {
  mixins: [Filterable, InteractsWithQueryString, PerPageable, RouteParameters],
  components: { ActionButton, LockIcon, ResetIcon, CollapseIcon },
  props: ['card', 'resourceName', 'viaResource', 'viaRelationship'],

  data: () => ({
    perPageStyle: null,
    persistedFilters: JSON.parse(localStorage.getItem('PERSISTED_DETACHED_FILTERS')),
    persistedResources: JSON.parse(localStorage.getItem('PERSIST_DETACHED_FILTERS')),
    collapsedResources: JSON.parse(localStorage.getItem('COLLAPSED_DETACHED_FILTERS')),

    isPersisting: false,
    isCollapsed: false,
    activeTab: 0,
  }),

  created() {
    this.initialiseIsPersisting();
    this.initialiseIsCollapsed();

    if (this.isPersisting) {
      if (this.persistedFilters && this.persistedFilters[this.resourceName]) this.loadPersistedFilters();
      else this.initializePersistedFilters();
    }
  },

  mounted() {
    if (!this.card.showPerPageInMenu) this.perPageDropdownStyle(true);
  },

  destroyed() {
    if (!this.card.showPerPageInMenu) this.perPageDropdownStyle(false);
  },

  computed: {
    hasAnyActions() {
      return this.card.withReset || this.card.withToggle || this.card.persistFilters;
    },
    tabGroups() {
      return this.card.filters?.filter(f => f.isTabGroup) || [];
    },
    hasTabs() {
      return this.tabGroups.length > 0;
    },
  },

  methods: {
    tabHasActiveFilters(filters) {
      return this.countActiveFilters(filters) > 0;
    },

    countActiveFilters(filters) {
      return filters.reduce((total, filter) => {
        try {
          const filterInStore = this.$store.getters[`${this.resourceName}/getFilter`](filter.class);
          return total + (filterInStore?.currentValue != null && filterInStore?.currentValue !== '' ? 1 : 0);
        } catch (e) {
          return total;
        }
      }, 0);
    },

    getWidth(filter) {
      if (filter.width) return filter.width;
      return 'w-auto';
    },

    resetFilter(filter) {
      this.$store.commit(`${this.resourceName}/updateFilterState`, {
        filterClass: filter.class,
        value: null,
      });

      this.handleFilterChanged(filter);
    },

    isFilterComponent(item) {
      return !!item.options && !!item.component;
    },

    toggleIsPersisting() {
      if (!this.persistedResources) this.persistedResources = {};
      if (this.persistedResources[this.resourceName]) this.persistedResources[this.resourceName] = [];

      this.persistedResources[this.resourceName] = !this.isPersisting;
      this.isPersisting = !this.isPersisting;

      localStorage.setItem('PERSIST_DETACHED_FILTERS', JSON.stringify(this.persistedResources));

      this.initializePersistedFilters();
      if (this.isPersisting) this.loadPersistedFromFilters();
    },

    toggleIsCollapsed() {
      if (!this.collapsedResources) this.collapsedResources = {};
      if (this.collapsedResources[this.resourceName]) this.collapsedResources[this.resourceName] = [];

      this.collapsedResources[this.resourceName] = !this.isCollapsed;
      this.isCollapsed = !this.isCollapsed;

      localStorage.setItem('COLLAPSED_DETACHED_FILTERS', JSON.stringify(this.collapsedResources));
    },

    loadPersistedFilters() {
      this.persistedFilters[this.resourceName].forEach(filterItem => {
        this.$store.commit(`${this.resourceName}/updateFilterState`, {
          filterClass: filterItem.filterClass,
          value: filterItem.value,
        });
      });

      this.syncFilters();
    },

    handleFilterChanged(filter) {
      this.filterChanged();

      if (this.isPersisting) {
        const updatedFilter = this.getFilter(filter.class);
        if (!updatedFilter) return;
        const filterIndex = this.persistedFilters[this.resourceName].findIndex(f => filter.class === f.filterClass);
        if (filterIndex == null || filterIndex < 0 || !this.persistedFilters[this.resourceName][filterIndex]) {
          this.persistedFilters[this.resourceName].push({
            filterClass: filter.class,
            value: updatedFilter.currentValue,
          });
        } else {
          this.persistedFilters[this.resourceName][filterIndex].value = updatedFilter.currentValue;
        }

        localStorage.setItem('PERSISTED_DETACHED_FILTERS', JSON.stringify(this.persistedFilters));
      }
    },

    getFilter(filterKey) {
      return this.$store.getters[`${this.resourceName}/getFilter`](filterKey);
    },

    getFilters() {
      return this.$store.getters[`${this.resourceName}/filters`];
    },

    initializePersistedFilters() {
      if (!this.persistedFilters) this.persistedFilters = {};
      this.persistedFilters[this.resourceName] = [];

      localStorage.setItem('PERSISTED_DETACHED_FILTERS', JSON.stringify(this.persistedFilters));
    },

    clearAllFilters() {
      this.initializePersistedFilters();
      this.clearSelectedFilters();
    },

    loadPersistedFromFilters() {
      this.getFilters().forEach(filterItem => {
        this.persistedFilters[this.resourceName].push({
          filterClass: filterItem.class,
          value: filterItem.currentValue,
        });
      });

      localStorage.setItem('PERSISTED_DETACHED_FILTERS', JSON.stringify(this.persistedFilters));
    },

    perPageDropdownStyle(addStyle) {
      const css = "div[dusk='filter-per-page'] { display: none !important }";
      const head = document.head || document.getElementsByTagName('head')[0];

      if (!this.perPageStyle) this.perPageStyle = document.createElement('style');
      addStyle ? head.appendChild(this.perPageStyle) : head.removeChild(this.perPageStyle);

      if (addStyle) this.perPageStyle.appendChild(document.createTextNode(css));
    },

    initialiseIsPersisting() {
      if (!this.persistedResources || !this.persistedResources[this.resourceName])
        return (this.isPersisting = this.card.persistFiltersDefault);
      this.isPersisting = this.persistedResources[this.resourceName];
    },

    initialiseIsCollapsed() {
      if (!this.collapsedResources || !this.collapsedResources[this.resourceName]) return (this.isCollapsed = false);
      this.isCollapsed = this.collapsedResources[this.resourceName];
    },
  },
};
</script>
