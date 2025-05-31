package handlers_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bartbaranski/eventhub/internal/handlers"
	"github.com/bartbaranski/eventhub/internal/storage"
)

func TestRegister(t *testing.T) {
	db := storage.NewTestDB()
	handler := handlers.Register(db)

	body := []byte(`{"email":"user@example.com","password":"Pass123!","role":"participant"}`)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewReader(body))
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", w.Code)
	}
}
