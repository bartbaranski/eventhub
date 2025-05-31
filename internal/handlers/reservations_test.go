// File: internal/handlers/reservations_test.go
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
	"github.com/bartbaranski/eventhub/internal/models"
	"github.com/bartbaranski/eventhub/internal/storage"
	"github.com/golang-jwt/jwt/v4"
)

func newResDB(t *testing.T) *sql.DB {
	db := storage.NewTestDB()
	stmts := []string{
		`CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date DATETIME NOT NULL,
            capacity INTEGER NOT NULL,
            organizer_id INTEGER NOT NULL
        );`,
		`CREATE TABLE reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            tickets INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("failed to exec schema: %v", err)
		}
	}
	return db
}

func TestCreateAndListReservations(t *testing.T) {
	db := newResDB(t)
	hCreate := handlers.CreateReservation(db)

	// zakładając user.id = 7
	claims := jwt.MapClaims{"id": float64(7)}
	// <-- tutaj wstrzykujemy przez auth.NewContext
	ctx := auth.NewContext(context.Background(), claims)

	reqBody := `{"event_id":99,"tickets":3}`
	req := httptest.NewRequest("POST", "/reservations", bytes.NewBufferString(reqBody)).WithContext(ctx)
	w := httptest.NewRecorder()
	hCreate(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", w.Code)
	}

	// teraz lista
	hList := handlers.ListReservations(db)
	req2 := httptest.NewRequest("GET", "/reservations", nil).WithContext(ctx)
	w2 := httptest.NewRecorder()
	hList(w2, req2)

	var rs []models.Reservation
	if err := json.Unmarshal(w2.Body.Bytes(), &rs); err != nil {
		t.Fatalf("unmarshal list: %v", err)
	}
	if len(rs) != 1 {
		t.Fatalf("expected 1 reservation, got %d", len(rs))
	}
	if rs[0].UserID != 7 || rs[0].EventID != 99 || rs[0].Tickets != 3 {
		t.Errorf("unexpected reservation: %+v", rs[0])
	}
}
