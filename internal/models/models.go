package models

import "time"

type User struct {
	ID           int
	Email        string
	PasswordHash string
	Role         string
}

type Event struct {
	ID          int
	Title       string
	Description string
	Date        time.Time
	Capacity    int
	OrganizerID int
}

type Reservation struct {
	ID        int
	UserID    int
	EventID   int
	Tickets   int
	CreatedAt time.Time
}
