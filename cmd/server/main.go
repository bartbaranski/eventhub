package main

import (
	"log"
	"net/http"

	"eventhub/internal/auth"
	"eventhub/internal/handlers"
	"eventhub/internal/storage"

	"github.com/gorilla/mux"
)

func main() {
	cfg := loadConfig("configs/config.yaml")
	auth.Init(cfg.JWTSecret)

	db := storage.NewPostgres(cfg.DatabaseURL)
	defer db.Close()

	r := mux.NewRouter()
	api := r.PathPrefix("/api/v1").Subrouter()

	// Authentication
	api.HandleFunc("/auth/register", handlers.Register(db)).Methods("POST")
	api.HandleFunc("/auth/login", handlers.Login(db)).Methods("POST")

	// Events
	api.HandleFunc("/events", handlers.ListEvents(db)).Methods("GET")
	api.HandleFunc("/events", auth.JWTMiddleware(handlers.CreateEvent(db))).Methods("POST")
	api.HandleFunc("/events/{id}", handlers.GetEvent(db)).Methods("GET")
	api.HandleFunc("/events/{id}", auth.JWTMiddleware(handlers.UpdateEvent(db))).Methods("PUT")
	api.HandleFunc("/events/{id}", auth.JWTMiddleware(handlers.DeleteEvent(db))).Methods("DELETE")

	// Reservations
	api.HandleFunc("/reservations", auth.JWTMiddleware(handlers.ListReservations(db))).Methods("GET")
	api.HandleFunc("/reservations", auth.JWTMiddleware(handlers.CreateReservation(db))).Methods("POST")

	log.Printf("Server running at %s", cfg.ServerAddress)
	log.Fatal(http.ListenAndServe(cfg.ServerAddress, r))
}
