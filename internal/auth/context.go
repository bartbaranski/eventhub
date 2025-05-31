package auth

import (
	"context"

	"github.com/golang-jwt/jwt/v4"
)

// contextKey is a private type to use as context keys
type contextKey string

// userContextKey is the key under which JWT claims are stored
const userContextKey contextKey = "user"

// NewContext returns a new Context that carries the JWT claims.
func NewContext(ctx context.Context, claims jwt.MapClaims) context.Context {
	return context.WithValue(ctx, userContextKey, claims)
}

// FromContext retrieves the JWT claims from Context.
func FromContext(ctx context.Context) (jwt.MapClaims, bool) {
	v := ctx.Value(userContextKey)
	claims, ok := v.(jwt.MapClaims)
	return claims, ok
}
