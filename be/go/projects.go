package main

import (
	"database/sql"
	"net/http"
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

	rows, err := a.DB.QueryContext(r.Context(),
		`SELECT id, name, description, status, created_at
		   FROM projects
		  WHERE organization_id = $1
		  ORDER BY created_at DESC`, user.OrganizationID)
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
