# El user pool es el "tenant" de la guía 1.2.3: el directorio donde viven los
# usuarios y, a la vez, el servidor de autorización que emite los tokens.
resource "aws_cognito_user_pool" "pool" {
name = "dsy1107-grupo777"
# El correo es el nombre de usuario, como en cualquier CIAM.
username_attributes = ["email"]
auto_verified_attributes = ["email"]
password_policy {
minimum_length = 8
require_lowercase = true
require_uppercase = true
require_numbers = true
require_symbols = false
}
# Solo un administrador crea usuarios. Con auto-registro esto sería false.
admin_create_user_config {
allow_admin_create_user_only = true
}
}

resource "aws_cognito_user_pool_domain" "hosted_ui" {
    domain       = "dsy1107-grupo777"
user_pool_id = aws_cognito_user_pool.pool.id

# 1 = Hosted UI clásica. La versión 2 (Managed Login) exige definir un
# branding style o la pantalla de login queda en blanco.
managed_login_version = 1
}


# Nuestro futuro front en React es un CLIENTE PÚBLICO: su código se descarga
# completo en el navegador, así que no puede guardar un secreto. Por eso
# generate_secret = false y por eso el flujo será Authorization Code + PKCE.
resource "aws_cognito_user_pool_client" "spa" {
  name            = "spa-react"
  user_pool_id    = aws_cognito_user_pool.pool.id
  generate_secret = false

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  supported_identity_providers         = ["COGNITO"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  # Debe coincidir EXACTAMENTE con el redirect_uri que envíe la aplicación,
  # incluida la barra final. Es el error número uno de esta actividad.
  callback_urls = ["http://localhost:5173/"]
  logout_urls   = ["http://localhost:5173/"]

  # ALLOW_USER_PASSWORD_AUTH se habilita solo para poder probar por consola en
  # el paso 7. En el paso 10 se quita: una app nunca debe ver la contraseña.
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  # Tokens cortos a propósito: que expiren durante la clase es parte del ejercicio.
  access_token_validity = 60
  id_token_validity     = 60

  token_validity_units {
    access_token = "minutes"
    id_token     = "minutes"
  }
}


resource "aws_cognito_user" "demo" {
  user_pool_id = aws_cognito_user_pool.pool.id
  username = "Mathias@gmail.com"
  password = "Duoc2026"

  attributes = {
    email = "Mathias@gmail.com"
    email_verified = true
    name = "Mathias"
  }
  message_action = "SUPPRESS"
  
}

output "user_pool_id" {
  value       = aws_cognito_user_pool.pool.id
  description = "ID del User Pool"
}

output "user_pool_client_id" {
  value       = aws_cognito_user_pool_client.spa.id
  description = "ID del App Client para el frontend"
}

