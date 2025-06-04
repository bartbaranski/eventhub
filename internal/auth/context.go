package auth

import (
	"context"

	"github.com/golang-jwt/jwt/v4"
)


type contextKey string


const userContextKey contextKey = "user"


func NewContext(ctx context.Context, claims jwt.MapClaims) context.Context {
	return context.WithValue(ctx, userContextKey, claims)
}


func FromContext(ctx context.Context) (jwt.MapClaims, bool) {
	v := ctx.Value(userContextKey)
	claims, ok := v.(jwt.MapClaims)
	return claims, ok
}
