package storage

import (
	"database/sql"

	_ "github.com/jackc/pgx/v4/stdlib"
)

type Postgres struct {
	DB *sql.DB
}

func NewPostgres(dsn string) *Postgres {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		panic(err)
	}
	return &Postgres{DB: db}
}

func (p *Postgres) Close() {
	p.DB.Close()
}
