package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Project struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
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

	query := "SELECT id, name, description, status, created_at FROM projects WHERE " + where +
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
	writeJSON(w, http.StatusOK, projects)
}

func (a *App) getProject(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)

	var p Project
	err := a.DB.QueryRowContext(r.Context(),
		`SELECT id, name, description, status, created_at
		   FROM projects
		  WHERE id = $1 AND organization_id = $2`,
		r.PathValue("id"), user.OrganizationID,
	).Scan(&p.ID, &p.Name, &p.Description, &p.Status, &p.CreatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, p)
}
