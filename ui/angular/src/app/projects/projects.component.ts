import { Component, OnInit } from '@angular/core';
import { ApiService, Project } from '../services/api.service';

type SortKey = 'name' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  search = '';
  sortKey: SortKey = 'created_at';
  sortDir: SortDir = 'desc';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getProjects().subscribe((projects) => {
      this.projects = projects;
      this.loading = false;
    });
  }

  get visibleProjects(): Project[] {
    const needle = this.search.toLowerCase();
    return this.projects
      .filter((p) => p.name.toLowerCase().includes(needle))
      .sort((a, b) => (this.sortDir === 'asc' ? 1 : -1) * this.compare(a, b));
  }

  toggleDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
  }

  private compare(a: Project, b: Project): number {
    if (this.sortKey === 'created_at') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return a[this.sortKey].localeCompare(b[this.sortKey]);
  }
}
