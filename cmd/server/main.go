package main

import (
	"flag"
	"io/ioutil"
	"log"
	"net/http"

	"gopkg.in/yaml.v2"

	"github.com/bartbaranski/eventhub/internal/auth"
	"github.com/bartbaranski/eventhub/internal/handlers"
	"github.com/bartbaranski/eventhub/internal/storage"
	"github.com/gorilla/mux"
)

// Config holds application settings loaded from YAML
type Config struct {
	ServerAddress string `yaml:"serverAddress"`
	DatabaseURL   string `yaml:"databaseURL"`
	JWTSecret     string `yaml:"jwtSecret"`
}

// loadConfig reads YAML config from the provided path
func loadConfig(path string) (*Config, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func main() {
	// allow overriding config location via flag
	configPath := flag.String("config", "configs/config.yaml", "path to config file")
	flag.Parse()

	cfg, err := loadConfig(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// initialize JWT secret
	auth.Init(cfg.JWTSecret)

	// connect to database
	pg := storage.NewPostgres(cfg.DatabaseURL)
	defer pg.Close()

	// use underlying *sql.DB
	db := pg.DB

	r := mux.NewRouter()
	api := r.PathPrefix("/api/v1").Subrouter()

	// Authentication endpoints
	api.HandleFunc("/auth/register", handlers.Register(db)).Methods("POST")
	api.HandleFunc("/auth/login", handlers.Login(db)).Methods("POST")

	// Events endpoints
	api.HandleFunc("/events", handlers.ListEvents(db)).Methods("GET")
	api.HandleFunc("/events", auth.JWTMiddleware(handlers.CreateEvent(db))).Methods("POST")
	api.HandleFunc("/events/{id}", handlers.GetEvent(db)).Methods("GET")
	api.HandleFunc("/events/{id}", auth.JWTMiddleware(handlers.UpdateEvent(db))).Methods("PUT")
	api.HandleFunc("/events/{id}", auth.JWTMiddleware(handlers.DeleteEvent(db))).Methods("DELETE")

	// Reservations endpoints
	api.HandleFunc("/reservations", auth.JWTMiddleware(handlers.ListReservations(db))).Methods("GET")
	api.HandleFunc("/reservations", auth.JWTMiddleware(handlers.CreateReservation(db))).Methods("POST")

	log.Printf("Starting server on %s", cfg.ServerAddress)
	log.Fatal(http.ListenAndServe(cfg.ServerAddress, r))
}
