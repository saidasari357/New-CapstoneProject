variable "location" {
  description = "Azure region for App Service resources"
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "rg-expense-recorder"
}

variable "service_plan_name" {
  description = "App Service plan name"
  type        = string
  default     = "asp-expense-recorder"
}

variable "frontend_webapp_name" {
  description = "Frontend Linux Web App name"
  type        = string
  default     = "app-expense-frontend"
}

variable "backend_webapp_name" {
  description = "Backend Linux Web App name"
  type        = string
  default     = "app-expense-backend"
}

variable "slot_name" {
  description = "Blue/Green slot name"
  type        = string
  default     = "green"
}

variable "acr_id" {
  description = "Resource ID of an existing Azure Container Registry"
  type        = string
}

variable "acr_login_server" {
  description = "ACR login server (example: myacr.azurecr.io)"
  type        = string
}

variable "frontend_image" {
  description = "Frontend image name:tag in ACR (without login server)"
  type        = string
  default     = "expense-frontend:latest"
}

variable "backend_image" {
  description = "Backend image name:tag in ACR (without login server)"
  type        = string
  default     = "expense-backend:latest"
}
