// File: internal/handlers/events.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/bartbaranski/eventhub/internal/auth"
	"github.com/bartbaranski/eventhub/internal/models"
	"github.com/gorilla/mux"
)

// ListEvents zwraca wszystkie wydarzenia.
func ListEvents(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(
			"SELECT id, title, description, date, capacity, organizer_id, image_url FROM events",
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		events := []models.Event{}
		for rows.Next() {
			var e models.Event
			if err := rows.Scan(
				&e.ID,
				&e.Title,
				&e.Description,
				&e.Date,
				&e.Capacity,
				&e.OrganizerID,
				&e.ImageURL,
			); err != nil {
				continue
			}
			events = append(events, e)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(events)
	}
}

// CreateEvent tworzy nowe wydarzenie (tylko organizator).
func CreateEvent(db *sql.DB) http.HandlerFunc {
	type request struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		DateTime    string `json:"date_time"` // spodziewamy się "YYYY-MM-DDTHH:MM"
		Capacity    int    `json:"capacity"`
		ImageURL    string `json:"image_url"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// 1) Uwierzytelnienie
		claims, ok := auth.FromContext(r.Context())
		if !ok || claims["role"] != "organizer" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		organizerID := int(claims["id"].(float64))

		// 2) Dekodowanie requestu
		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// 3) Parsowanie daty+godziny "YYYY-MM-DDTHH:MM" na time.Time
		parsedDateTime, err := time.Parse("2006-01-02T15:04", req.DateTime)
		if err != nil {
			http.Error(w, "Invalid datetime format, use YYYY-MM-DDTHH:MM", http.StatusBadRequest)
			return
		}

		// 4) Wstawienie do bazy; Postgres przyjmie parsedDateTime jako TIMESTAMP
		var newID int
		err = db.QueryRow(
			`INSERT INTO events(title, description, date, capacity, organizer_id, image_url)
			 VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
			req.Title, req.Description, parsedDateTime, req.Capacity, organizerID, req.ImageURL,
		).Scan(&newID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// 5) Zwróć JSON z nowym ID
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]int{"id": newID})
	}
}

// GetEvent zwraca pojedyncze wydarzenie po ID.
func GetEvent(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(mux.Vars(r)["id"])
		var e models.Event
		err := db.QueryRow(
			"SELECT id, title, description, date, capacity, organizer_id, image_url FROM events WHERE id=$1", id,
		).Scan(
			&e.ID,
			&e.Title,
			&e.Description,
			&e.Date,
			&e.Capacity,
			&e.OrganizerID,
			&e.ImageURL,
		)
		if err != nil {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(e)
	}
}

// UpdateEvent aktualizuje istniejące wydarzenie (tylko właściciel).
func UpdateEvent(db *sql.DB) http.HandlerFunc {
	type request struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		DateTime    string `json:"date_time"` // spodziewamy się "YYYY-MM-DDTHH:MM"
		Capacity    int    `json:"capacity"`
		ImageURL    string `json:"image_url"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// 1) Uwierzytelnienie
		claims, ok := auth.FromContext(r.Context())
		if !ok || claims["role"] != "organizer" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		organizerID := int(claims["id"].(float64))

		// 2) Pobranie ID z URL
		id, _ := strconv.Atoi(mux.Vars(r)["id"])

		// 3) Dekodowanie requestu
		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// 4) Parsowanie daty+godziny
		parsedDateTime, err := time.Parse("2006-01-02T15:04", req.DateTime)
		if err != nil {
			http.Error(w, "Invalid datetime format, use YYYY-MM-DDTHH:MM", http.StatusBadRequest)
			return
		}

		// 5) Sprawdź, czy organizator jest właścicielem
		var owner int
		if err := db.QueryRow(
			"SELECT organizer_id FROM events WHERE id=$1", id,
		).Scan(&owner); err != nil || owner != organizerID {
			http.Error(w, "Forbidden or not found", http.StatusForbidden)
			return
		}

		// 6) Wykonaj UPDATE
		_, err = db.Exec(
			`UPDATE events
			 SET title=$1, description=$2, date=$3, capacity=$4, image_url=$5
			 WHERE id=$6`,
			req.Title, req.Description, parsedDateTime, req.Capacity, req.ImageURL, id,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// DeleteEvent usuwa wydarzenie (tylko właściciel).
// DeleteEvent usuwa wydarzenie (tylko właściciel).
// Najpierw usuwa powiązane rezerwacje, by uniknąć błędu FK.
func DeleteEvent(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1) Uwierzytelnienie
		claims, ok := auth.FromContext(r.Context())
		if !ok || claims["role"] != "organizer" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		organizerID := int(claims["id"].(float64))

		// 2) Pobranie ID
		id, _ := strconv.Atoi(mux.Vars(r)["id"])

		// 3) Sprawdź właściciela
		var owner int
		if err := db.QueryRow(
			"SELECT organizer_id FROM events WHERE id=$1", id,
		).Scan(&owner); err != nil || owner != organizerID {
			http.Error(w, "Forbidden or not found", http.StatusForbidden)
			return
		}

		// 4) Usuń powiązane rezerwacje z tabeli reservations
		if _, err := db.Exec("DELETE FROM reservations WHERE event_id=$1", id); err != nil {
			http.Error(w, "Error deleting related reservations", http.StatusInternalServerError)
			return
		}

		// 5) Usuń samo wydarzenie
		if _, err := db.Exec("DELETE FROM events WHERE id=$1", id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
