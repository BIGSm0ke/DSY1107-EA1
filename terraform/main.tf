resource "aws_apigatewayv2_api" "api_manager" {
  name          = "api-mindicador"
  protocol_type = "HTTP"

  # ¡NUEVO!: Bloque de CORS para permitir que el frontend lo consulte
  cors_configuration {
    allow_origins = ["http://localhost:5173", "http://localhost:5500"] # Añade el puerto de tu Live Server si usas otro
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
    max_age       = 300
  }
}

# 1. Autorizador JWT que conecta con Cognito
resource "aws_apigatewayv2_authorizer" "cognito_jwt" {
  api_id           = aws_apigatewayv2_api.api_manager.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.spa.id]
    issuer   = "https://cognito-idp.us-east-1.amazonaws.com/${aws_cognito_user_pool.pool.id}"
  }
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id                 = aws_apigatewayv2_api.api_manager.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "GET"
  integration_uri        = "https://mindicador.cl/api"
  payload_format_version = "1.0"
}

# 2. Ruta protegida con JWT
resource "aws_apigatewayv2_route" "datos" {
  api_id             = aws_apigatewayv2_api.api_manager.id
  route_key          = "GET /datos"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_jwt.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api_manager.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_stage" "dev" {
  api_id      = aws_apigatewayv2_api.api_manager.id
  name        = "dev"
  auto_deploy = true
}