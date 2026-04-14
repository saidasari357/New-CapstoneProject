resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_service_plan" "this" {
  name                = var.service_plan_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  os_type             = "Linux"
  sku_name = "S1"
}

resource "azurerm_linux_web_app" "frontend" {
  name                = var.frontend_webapp_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  service_plan_id     = azurerm_service_plan.this.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                              = true
    health_check_path                      = "/"
        health_check_eviction_time_in_min      = 2
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = var.frontend_image
      docker_registry_url = "https://${var.acr_login_server}"
    }
  }
}

resource "azurerm_linux_web_app" "backend" {
  name                = var.backend_webapp_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  service_plan_id     = azurerm_service_plan.this.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    WEBSITES_PORT = "8080"
  }

  site_config {
    always_on                              = true
    health_check_path                      = "/api/health"
        health_check_eviction_time_in_min      = 2
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = var.backend_image
      docker_registry_url = "https://${var.acr_login_server}"
    }
  }
}

resource "azurerm_linux_web_app_slot" "frontend_green" {
  name           = var.slot_name
  app_service_id = azurerm_linux_web_app.frontend.id
  https_only     = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                              = true
    health_check_path                      = "/"
        health_check_eviction_time_in_min      = 2
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = var.frontend_image
      docker_registry_url = "https://${var.acr_login_server}"
    }
  }
}

resource "azurerm_linux_web_app_slot" "backend_green" {
  name           = var.slot_name
  app_service_id = azurerm_linux_web_app.backend.id
  https_only     = true

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    WEBSITES_PORT = "8080"
  }

  site_config {
    always_on                              = true
    health_check_path                      = "/api/health"
        health_check_eviction_time_in_min      = 2
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = var.backend_image
      docker_registry_url = "https://${var.acr_login_server}"
    }
  }
}

resource "azurerm_role_assignment" "frontend_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.frontend.identity[0].principal_id
}

resource "azurerm_role_assignment" "backend_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.backend.identity[0].principal_id
}

resource "azurerm_role_assignment" "frontend_slot_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app_slot.frontend_green.identity[0].principal_id
}

resource "azurerm_role_assignment" "backend_slot_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app_slot.backend_green.identity[0].principal_id
}
