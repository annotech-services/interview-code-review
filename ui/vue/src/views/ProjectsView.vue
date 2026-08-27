<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchProjects, type Project } from '../api/client';
import { DATE_LOCALE } from '../config';

const projects = ref<Project[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE);
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    projects.value = await fetchProjects();
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <p v-if="loading" class="muted">Loading projects…</p>

  <div v-else-if="error" class="alert alert-error">
    Could not load projects ({{ error }}).
    <button class="btn btn-link" @click="load">Retry</button>
  </div>

  <p v-else-if="projects.length === 0" class="muted">No projects yet.</p>

  <table v-else class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="p in projects" :key="p.id">
        <td>{{ p.name }}</td>
        <td>
          <span :class="`badge badge-${p.status}`">{{ p.status }}</span>
        </td>
        <td>{{ formatDate(p.created_at) }}</td>
      </tr>
    </tbody>
  </table>
</template>
