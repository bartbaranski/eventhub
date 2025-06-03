package models

import "time"

type User struct {
	ID           int    `json:"id"`
	Email        string `json:"email"`
	PasswordHash string `json:"password_hash"`
	Role         string `json:"role"`
}

type Event struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	Capacity    int       `json:"capacity"`
	OrganizerID int       `json:"organizer_id"`
	ImageURL    string    `json:"image_url"`
}

type Reservation struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	EventID   int       `json:"event_id"`
	Tickets   int       `json:"tickets"`
	CreatedAt time.Time `json:"created_at"`
}
