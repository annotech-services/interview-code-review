package main

import (
	"context"
	"net/http"
	"strings"
)

type User struct {
	ID             int
	OrganizationID int
	Role           string
}

type userKey struct{}

func (a *App) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			next.ServeHTTP(w, r)
			return
		}

		token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if token == "" || token == r.Header.Get("Authorization") {
			writeError(w, http.StatusUnauthorized, "missing bearer token")
			return
		}

		var u User
		err := a.DB.QueryRowContext(r.Context(),
			`SELECT u.id, u.organization_id, u.role
			   FROM sessions s
			   JOIN users u ON u.id = s.user_id
			  WHERE s.token = $1 AND s.expires_at > now()`, token,
		).Scan(&u.ID, &u.OrganizationID, &u.Role)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		ctx := context.WithValue(r.Context(), userKey{}, u)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func currentUser(r *http.Request) User {
	return r.Context().Value(userKey{}).(User)
}
