output "frontend_default_url" {
  value = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "backend_default_url" {
  value = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "frontend_slot_url" {
  value = "https://${azurerm_linux_web_app_slot.frontend_green.default_hostname}"
}

output "backend_slot_url" {
  value = "https://${azurerm_linux_web_app_slot.backend_green.default_hostname}"
}
