package handlers_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/bartbaranski/eventhub/internal/handlers"
	"github.com/bartbaranski/eventhub/internal/models"
	"github.com/bartbaranski/eventhub/internal/storage"
)

func newEventDB(t *testing.T) *sql.DB {
	db := storage.NewTestDB()
	// Stwórz tabelkę events
	schema := `
    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date DATETIME NOT NULL,
      capacity INTEGER NOT NULL,
      organizer_id INTEGER NOT NULL
    );`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create events table: %v", err)
	}
	return db
}

func TestListEvents_Empty(t *testing.T) {
	db := newEventDB(t)
	h := handlers.ListEvents(db)

	req := httptest.NewRequest("GET", "/events", nil)
	w := httptest.NewRecorder()
	h(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var ev []models.Event
	if err := json.Unmarshal(w.Body.Bytes(), &ev); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(ev) != 0 {
		t.Fatalf("expected empty slice, got %v", ev)
	}
}

func TestCreateAndListEvents(t *testing.T) {
	db := newEventDB(t)
	hCreate := handlers.CreateEvent(db)

	evt := models.Event{
		Title:       "Tytuł",
		Description: "Opis",
		Date:        time.Date(2025, 6, 1, 9, 0, 0, 0, time.UTC),
		Capacity:    100,
		OrganizerID: 1,
	}
	body, _ := json.Marshal(evt)
	req := httptest.NewRequest("POST", "/events", bytes.NewReader(body))
	w := httptest.NewRecorder()
	hCreate(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", w.Code)
	}

	// teraz lista
	hList := handlers.ListEvents(db)
	req2 := httptest.NewRequest("GET", "/events", nil)
	w2 := httptest.NewRecorder()
	hList(w2, req2)

	var ev []models.Event
	if err := json.Unmarshal(w2.Body.Bytes(), &ev); err != nil {
		t.Fatalf("unmarshal list: %v", err)
	}
	if len(ev) != 1 {
		t.Fatalf("expected 1 event, got %d", len(ev))
	}
	if ev[0].Title != evt.Title {
		t.Errorf("expected title %q, got %q", evt.Title, ev[0].Title)
	}
}
