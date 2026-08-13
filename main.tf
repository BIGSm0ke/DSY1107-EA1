resource "aws_apigatewayv2_api" "api_manager" {
  name          = "api-mindicador"
  protocol_type = "HTTP"

}

resource "aws_apigatewayv2_integration" "backend" {
  api_id                 = aws_apigatewayv2_api.api_manager.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "GET"
  integration_uri        = "https://mindicador.cl/api"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "datos" {
  api_id    = aws_apigatewayv2_api.api_manager.id
  route_key = "GET /datos"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"

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