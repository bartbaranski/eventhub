// internal/handlers/events_test.go

package handlers_test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bartbaranski/eventhub/internal/auth"
	"github.com/bartbaranski/eventhub/internal/handlers"
	"github.com/bartbaranski/eventhub/internal/storage"
	"github.com/golang-jwt/jwt/v4"
)

// newEventDB tworzy in-memory BD ze wszystkimi kolumnami, jakie wykorzystuje handler.
func newEventDB(t *testing.T) *sql.DB {
	db := storage.NewTestDB()
	schema := `
    CREATE TABLE events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      description  TEXT,
      date         DATETIME NOT NULL,
      capacity     INTEGER NOT NULL,
      organizer_id INTEGER NOT NULL,
      image_url    TEXT
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
	var ev []map[string]interface{}
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

	// Przygotuj kontekst z claims: user.id=1, role="organizer"
	claims := jwt.MapClaims{"id": float64(1), "role": "organizer"}
	ctx := auth.NewContext(context.Background(), claims)

	// Payload z polem "date_time" w formacie YYYY-MM-DDTHH:MM
	payload := map[string]interface{}{
		"title":       "Tytuł",
		"description": "Opis",
		"date_time":   "2025-06-01T09:00", // dokładny format
		"capacity":    100,
		"image_url":   "/images/test.jpg",
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	req := httptest.NewRequest("POST", "/events", bytes.NewReader(bodyBytes)).WithContext(ctx)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	hCreate(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d; body=%s", w.Code, w.Body.String())
	}

	// Teraz GET /events
	hList := handlers.ListEvents(db)
	req2 := httptest.NewRequest("GET", "/events", nil)
	w2 := httptest.NewRecorder()
	hList(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on list, got %d", w2.Code)
	}

	var ev []map[string]interface{}
	if err := json.Unmarshal(w2.Body.Bytes(), &ev); err != nil {
		t.Fatalf("unmarshal list: %v", err)
	}
	if len(ev) != 1 {
		t.Fatalf("expected 1 event, got %d", len(ev))
	}
	if ev[0]["title"] != "Tytuł" {
		t.Errorf("expected title %q, got %q", "Tytuł", ev[0]["title"])
	}
}
