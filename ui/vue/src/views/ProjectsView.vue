<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { fetchProjects, type Project } from '../api/client';
import { DATE_LOCALE } from '../config';

type SortKey = 'name' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

const projects = ref<Project[]>([]);
const loading = ref(true);
const search = ref('');
const sortKey = ref<SortKey>('created_at');
const sortDir = ref<SortDir>('desc');

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE);
}

function compare(a: Project, b: Project, key: SortKey): number {
  if (key === 'created_at') {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
  return a[key].localeCompare(b[key]);
}

const visible = computed(() =>
  projects.value
    .filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase()))
    .sort((a, b) => (sortDir.value === 'asc' ? 1 : -1) * compare(a, b, sortKey.value)),
);

async function load() {
  loading.value = true;
  projects.value = await fetchProjects().catch(() => []);
  loading.value = false;
}

function toggleDir() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
}

onMounted(load);
</script>

<template>
  <p v-if="loading" class="muted">Loading projects…</p>

  <div v-else class="projects">
    <div class="toolbar">
      <input v-model="search" class="input" placeholder="Search projects" />
      <select v-model="sortKey" class="select">
        <option value="name">Name</option>
        <option value="status">Status</option>
        <option value="created_at">Created</option>
      </select>
      <button class="btn" @click="toggleDir">
        {{ sortDir === 'asc' ? 'Ascending' : 'Descending' }}
      </button>
    </div>

    <p v-if="visible.length === 0" class="muted">No projects yet.</p>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in visible" :key="p.id">
          <td>{{ p.name }}</td>
          <td>
            <span :class="`badge badge-${p.status}`">{{ p.status }}</span>
          </td>
          <td>{{ formatDate(p.created_at) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
