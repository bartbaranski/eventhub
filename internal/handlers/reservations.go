// File: internal/handlers/reservations.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/bartbaranski/eventhub/internal/auth"
	"github.com/bartbaranski/eventhub/internal/models"
)

// ListReservations zwraca listę rezerwacji zalogowanego użytkownika.
func ListReservations(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Pobierz claims z kontekstu
		claims, ok := auth.FromContext(r.Context())
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		userID := int(claims["id"].(float64))

		// Query do bazy
		rows, err := db.Query(
			"SELECT id, user_id, event_id, tickets, created_at FROM reservations WHERE user_id = $1",
			userID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Wypełnij slice
		var out []models.Reservation
		for rows.Next() {
			var rsv models.Reservation
			if err := rows.Scan(
				&rsv.ID,
				&rsv.UserID,
				&rsv.EventID,
				&rsv.Tickets,
				&rsv.CreatedAt,
			); err != nil {
				continue
			}
			out = append(out, rsv)
		}

		// Zwróć JSON
		json.NewEncoder(w).Encode(out)
	}
}

// CreateReservation tworzy nową rezerwację dla zalogowanego użytkownika.
func CreateReservation(db *sql.DB) http.HandlerFunc {
	type request struct {
		EventID int `json:"event_id"`
		Tickets int `json:"tickets"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// 1) Pobierz claims
		claims, ok := auth.FromContext(r.Context())
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		userID := int(claims["id"].(float64))

		// 2) Dekoduj body
		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// 3) Wstaw do bazy
		_, err := db.Exec(
			"INSERT INTO reservations(user_id, event_id, tickets) VALUES($1,$2,$3)",
			userID, req.EventID, req.Tickets,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"status": "created"})
	}
}
