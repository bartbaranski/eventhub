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

// ListEvents returns all events.
func ListEvents(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT id,title,description,date,capacity,organizer_id FROM events")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		events := []models.Event{}
		for rows.Next() {
			var e models.Event
			if err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.Date, &e.Capacity, &e.OrganizerID); err != nil {
				continue
			}
			events = append(events, e)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(events)
	}
}

// CreateEvent creates a new event for the authenticated organizer.
func CreateEvent(db *sql.DB) http.HandlerFunc {
	type request struct {
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Date        time.Time `json:"date"`
		Capacity    int       `json:"capacity"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// 1) Authenticate & authorize
		claims, ok := auth.FromContext(r.Context())
		if !ok || claims["role"] != "organizer" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		organizerID := int(claims["id"].(float64))

		// 2) Decode request body (without organizer_id)
		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// 3) Insert into DB
		_, err := db.Exec(
			"INSERT INTO events(title,description,date,capacity,organizer_id) VALUES($1,$2,$3,$4,$5)",
			req.Title, req.Description, req.Date, req.Capacity, organizerID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

// GetEvent returns a single event by ID.
func GetEvent(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(mux.Vars(r)["id"])
		var e models.Event
		err := db.QueryRow(
			"SELECT id,title,description,date,capacity,organizer_id FROM events WHERE id=$1", id,
		).Scan(&e.ID, &e.Title, &e.Description, &e.Date, &e.Capacity, &e.OrganizerID)
		if err != nil {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(e)
	}
}

// UpdateEvent updates an existing event (only its owner can modify).
func UpdateEvent(db *sql.DB) http.HandlerFunc {
	type request struct {
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Date        time.Time `json:"date"`
		Capacity    int       `json:"capacity"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Authenticate & authorize
		claims, ok := auth.FromContext(r.Context())
		if !ok || claims["role"] != "organizer" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		organizerID := int(claims["id"].(float64))

		// Parse ID
		id, _ := strconv.Atoi(mux.Vars(r)["id"])

		// Decode body
		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Ensure organizer owns this event
		var owner int
		if err := db.QueryRow(
			"SELECT organizer_id FROM events WHERE id=$1", id,
		).Scan(&owner); err != nil || owner != organizerID {
			http.Error(w, "Forbidden or not found", http.StatusForbidden)
			return
		}

		// Update
		_, err := db.Exec(
			"UPDATE events SET title=$1,description=$2,date=$3,capacity=$4 WHERE id=$5",
			req.Title, req.Description, req.Date, req.Capacity, id,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// DeleteEvent deletes an event (only its owner can remove).
func DeleteEvent(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Authenticate & authorize
		claims, ok := auth.FromContext(r.Context())
		if !ok || claims["role"] != "organizer" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		organizerID := int(claims["id"].(float64))

		// Parse ID
		id, _ := strconv.Atoi(mux.Vars(r)["id"])

		// Ensure organizer owns this event
		var owner int
		if err := db.QueryRow(
			"SELECT organizer_id FROM events WHERE id=$1", id,
		).Scan(&owner); err != nil || owner != organizerID {
			http.Error(w, "Forbidden or not found", http.StatusForbidden)
			return
		}

		// Delete
		_, err := db.Exec("DELETE FROM events WHERE id=$1", id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
