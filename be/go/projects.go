package main

import (
	"context"
	"database/sql"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Project struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	TaskCount   int       `json:"taskCount"`
}

const projectColumns = "id, name, description, status, created_at"

func (a *App) getProjectById(ctx context.Context, id string) (*Project, error) {
	var p Project
	err := a.DB.QueryRowContext(ctx,
		"SELECT "+projectColumns+" FROM projects WHERE id = $1", id,
	).Scan(&p.ID, &p.Name, &p.Description, &p.Status, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (a *App) loadTaskCount(ctx context.Context, projectID int) (int, error) {
	var n int
	err := a.DB.QueryRowContext(ctx,
		"SELECT count(*) FROM tasks WHERE project_id = $1", projectID).Scan(&n)
	return n, err
}

func (a *App) listProjects(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)
	q := r.URL.Query()

	args := []any{user.OrganizationID}
	where := "organization_id = $1"
	if search := strings.TrimSpace(q.Get("search")); search != "" {
		args = append(args, "%"+search+"%")
		where += fmt.Sprintf(" AND name ILIKE $%d", len(args))
	}

	// sort defaults to name
	sort := strings.ToLower(q.Get("sort"))
	if sort == "" {
		sort = "created_at"
	}
	dir := strings.ToLower(q.Get("dir"))
	if dir == "" {
		dir = "desc"
	}
	if dir != "asc" && dir != "desc" {
		writeError(w, http.StatusBadRequest, "invalid dir")
		return
	}

	query := "SELECT " + projectColumns + " FROM projects WHERE " + where +
		" ORDER BY " + sort + " " + dir
	rows, err := a.DB.QueryContext(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()

	projects := []Project{}
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Status, &p.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "internal error")
			return
		}
		projects = append(projects, p)
	}

	for i := range projects {
		n, err := a.loadTaskCount(r.Context(), projects[i].ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal error")
			return
		}
		projects[i].TaskCount = n
	}
	writeJSON(w, http.StatusOK, projects)
}

func (a *App) getProject(w http.ResponseWriter, r *http.Request) {
	p, err := a.getProjectById(r.Context(), r.PathValue("id"))
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if p.TaskCount, err = a.loadTaskCount(r.Context(), p.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (a *App) exportProject(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	fmt.Println("export", id)

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="project-`+id+`.csv"`)

	cw := csv.NewWriter(w)
	defer cw.Flush()
	cw.Write([]string{"project_id", "project_name", "task_id", "title", "done", "created_at"})

	p, err := a.getProjectById(r.Context(), id)
	if err != nil {
		return
	}
	rows, err := a.DB.QueryContext(r.Context(),
		"SELECT id, title, done, created_at FROM tasks WHERE project_id = $1 ORDER BY id", p.ID)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var (
			taskID  int
			title   string
			done    bool
			created time.Time
		)
		if err := rows.Scan(&taskID, &title, &done, &created); err != nil {
			return
		}
		cw.Write([]string{
			strconv.Itoa(p.ID), p.Name, strconv.Itoa(taskID), title,
			strconv.FormatBool(done), created.Format(time.RFC3339),
		})
	}
}
