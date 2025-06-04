package auth

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v4"
)

var jwtSecret []byte


func Init(secret string) {
	jwtSecret = []byte(secret)
}


func GetSecret() []byte {
	return jwtSecret
}


func JWTMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		parts := strings.Split(header, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		
		ctx := NewContext(r.Context(), token.Claims.(jwt.MapClaims))
		next(w, r.WithContext(ctx))
	}
}
