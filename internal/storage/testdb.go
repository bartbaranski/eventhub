// File: internal/storage/testdb.go
package storage

import (
	"database/sql"

	_ "github.com/glebarez/sqlite" // czysto-go sterownik
)

// NewTestDB zwraca połączenie do in-memory SQLite (pure-Go)
func NewTestDB() *sql.DB {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		panic(err)
	}
	schema := `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL
    );`
	if _, err := db.Exec(schema); err != nil {
		panic(err)
	}
	return db
}
