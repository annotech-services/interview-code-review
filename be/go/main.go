package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	db, err := openDB(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	app := &App{DB: db}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	})
	mux.HandleFunc("GET /api/projects", app.listProjects)
	mux.HandleFunc("GET /api/projects/{id}", app.getProject)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Printf("project-tracker api listening on %s", port)
	log.Fatal(http.ListenAndServe(":"+port, app.requireAuth(mux)))
}
