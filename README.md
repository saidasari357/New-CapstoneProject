# Expense Recorder Capstone

Complete documentation for your training project: full-stack app, containerization, CI/CD, AKS blue/green deployment, and Terraform with App Service slots.

## 1. Project Summary

Expense Recorder is a simple web application that allows users to:

1. Add expense records
2. View expense history
3. Visualize spending in chart format
4. Delete records

This project demonstrates a production-style DevOps lifecycle:

1. Build from source
2. Containerize frontend and backend
3. Scan images for vulnerabilities
4. Push images to Azure Container Registry (ACR)
5. Deploy to Azure Kubernetes Service (AKS) using blue/green strategy
6. Keep zero-downtime behavior by switching traffic only after validation
7. Support an alternate deployment path with Terraform using Azure Web Apps and slots

## 2. Scope Covered Against Capstone Requirements

1. GitHub Actions pipeline using GitHub-hosted runners: implemented
2. Branching with two dev branches and one main branch: documented (`dev1`, `dev2`, `main`)
3. Separate frontend and backend codebases: implemented
4. Build and tag Docker image on code change for both apps: implemented
5. Push images to ACR: implemented in workflow
6. Image scanning with Trivy: implemented with fail gate
7. Deploy to Kubernetes AKS: implemented in workflow and manifests
8. Frontend service type `LoadBalancer`: implemented
9. Backend service type `ClusterIP`: implemented
10. Blue/green deployment process: implemented
11. Rollback/no-downtime behavior: implemented by cutover guard
12. Terraform web app deployment with slots: implemented

## 3. Current Status of Azure Resources

Important clarification:

1. This repository is fully prepared for Azure.
2. No live Azure resources were created by this implementation step.
3. You must provide Azure credentials and run deployment workflows/commands to provision and deploy.

## 4. Technology Stack

1. Frontend: React + Vite + Chart.js
2. Backend: Node.js + Express
3. Containers: Docker
4. CI/CD: GitHub Actions
5. Security Scan: Trivy
6. Kubernetes deployment target: AKS
7. IaC: Terraform (`azurerm` provider)
8. Optional PaaS deployment target: Azure App Service + deployment slots

## 5. Repository Structure

1. [frontend](frontend): React frontend
2. [backend](backend): Express backend
3. [k8s/base](k8s/base): Namespace and services
4. [k8s/templates](k8s/templates): Blue/green deployment templates
5. [.github/workflows/cicd-aks.yml](.github/workflows/cicd-aks.yml): CI/CD pipeline
6. [infra/terraform](infra/terraform): Terraform for App Service and slots
7. [docker-compose.yml](docker-compose.yml): Local multi-container run

## 6. Application Architecture

1. User opens frontend via public endpoint (local `:3000` or AKS LoadBalancer).
2. Frontend serves static app through NGINX.
3. Frontend calls `/api/*`.
4. NGINX proxies `/api` to backend service in Kubernetes.
5. Backend processes request and reads/writes expense records.
6. Frontend renders updated charts.

## 7. Source Components

### 7.1 Frontend

1. Main app logic and chart rendering: [frontend/src/App.jsx](frontend/src/App.jsx)
2. API client functions: [frontend/src/api.js](frontend/src/api.js)
3. Styling: [frontend/src/styles.css](frontend/src/styles.css)
4. Build config: [frontend/vite.config.js](frontend/vite.config.js)

### 7.2 Backend

1. REST API routes and validation: [backend/src/server.js](backend/src/server.js)
2. File-based persistence utilities: [backend/src/store.js](backend/src/store.js)
3. Seed data: [backend/data/expenses.json](backend/data/expenses.json)

### 7.3 Container Files

1. Backend image: [backend/Dockerfile](backend/Dockerfile)
2. Frontend image: [frontend/Dockerfile](frontend/Dockerfile)
3. Frontend runtime reverse-proxy rules: [frontend/nginx.conf](frontend/nginx.conf)

## 8. API Documentation

Base path: `/api`

1. `GET /api/health`
   - Purpose: health check for readiness/liveness
   - Response example: `{ "status": "ok", "service": "expense-backend" }`

2. `GET /api/expenses`
   - Purpose: list expenses ordered by latest first
   - Response: JSON array of expense objects

3. `POST /api/expenses`
   - Purpose: add expense
   - Required fields: `title`, `amount`, `category`, `spentAt`
   - Validation: amount must be positive number
   - Response: created expense object with `id` and `createdAt`

4. `DELETE /api/expenses/:id`
   - Purpose: delete expense by id
   - Success response: `204 No Content`
   - Missing id response: `404`

Expense object shape:

```json
{
  "id": "string",
  "title": "string",
  "amount": 49.99,
  "category": "Food",
  "spentAt": "2026-03-29",
  "createdAt": "2026-03-29T10:10:10.000Z"
}
```

## 9. Local Development Guide

### 9.1 Prerequisites

1. Node.js 20+
2. npm
3. Docker Desktop (for container flow)

### 9.2 Run with Docker (recommended)

```bash
docker compose up --build
```

Endpoints:

1. Frontend: `http://localhost:3000`
2. Backend health: `http://localhost:8080/api/health`

### 9.3 Run without Docker

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## 10. Branching Strategy

Use three branches:

1. `dev1`: development lane 1
2. `dev2`: development lane 2
3. `main`: release/production lane

CI/CD workflow triggers on pushes to all three.

## 11. CI/CD Pipeline Documentation

Workflow file: [.github/workflows/cicd-aks.yml](.github/workflows/cicd-aks.yml)

### 11.1 Trigger

1. `push` to `main`, `dev1`, `dev2`
2. `workflow_dispatch` manual run

### 11.2 Build and Scan Job

Runs matrix for two components:

1. frontend
2. backend

Steps per component:

1. Checkout code
2. Azure login (OIDC)
3. ACR login
4. Build Docker image
5. Tag image as `${GITHUB_SHA}-${GITHUB_RUN_NUMBER}`
6. Push to ACR
7. Scan with Trivy
8. Fail pipeline on HIGH/CRITICAL findings

### 11.3 Deploy Blue/Green Job

Steps:

1. Configure AKS context
2. Ensure namespace/services exist
3. Detect current live color from service selector
4. Pick inactive color as target
5. Render manifests with target color and new image tag
6. Deploy target color pods
7. Wait for rollout status
8. Run smoke tests to target pods
9. If checks pass, patch services to target color
10. If checks fail, no cutover happens and previous color remains live

## 12. Required GitHub Secrets

Set these in repository secrets before running CI/CD:

1. `AZURE_CLIENT_ID`
2. `AZURE_TENANT_ID`
3. `AZURE_SUBSCRIPTION_ID`
4. `ACR_NAME`
5. `ACR_LOGIN_SERVER` (example: `myacr.azurecr.io`)
6. `AKS_RESOURCE_GROUP`
7. `AKS_CLUSTER_NAME`

## 13. AKS Kubernetes Documentation

### 13.1 Base Manifests

1. Namespace and service account: [k8s/base/namespace.yaml](k8s/base/namespace.yaml)
2. Services: [k8s/base/services.yaml](k8s/base/services.yaml)

Service model:

1. `frontend-svc` is `LoadBalancer` and exposes app publicly
2. `backend-svc` is `ClusterIP` and internal-only

### 13.2 Deployment Templates

1. Frontend template: [k8s/templates/frontend-deployment.yaml](k8s/templates/frontend-deployment.yaml)
2. Backend template: [k8s/templates/backend-deployment.yaml](k8s/templates/backend-deployment.yaml)

Template placeholders:

1. `__COLOR__`: blue or green
2. `__IMAGE__`: full image URI

### 13.3 Health Checks

1. Backend readiness/liveness path: `/api/health`
2. Frontend readiness/liveness path: `/`

## 14. Blue/Green Release and Rollback Behavior

Release behavior:

1. Keep live color untouched.
2. Deploy new version to inactive color.
3. Validate rollout and smoke tests.
4. Switch services only if valid.

Rollback behavior:

1. On failure before cutover, traffic never leaves stable color.
2. Effective rollback is immediate because selectors are not switched.
3. No planned downtime for failed releases.

## 15. Terraform Documentation (App Service + Slots)

Folder: [infra/terraform](infra/terraform)

Files:

1. Provider/version config: [infra/terraform/versions.tf](infra/terraform/versions.tf)
2. Input variables: [infra/terraform/variables.tf](infra/terraform/variables.tf)
3. Resources: [infra/terraform/main.tf](infra/terraform/main.tf)
4. Outputs: [infra/terraform/outputs.tf](infra/terraform/outputs.tf)
5. Example values: [infra/terraform/terraform.tfvars.example](infra/terraform/terraform.tfvars.example)

Resources created by Terraform when applied:

1. Resource Group
2. Linux App Service Plan
3. Frontend Linux Web App
4. Backend Linux Web App
5. Frontend slot (`green` by default)
6. Backend slot (`green` by default)
7. `AcrPull` role assignments for app and slot managed identities

### 15.1 Terraform Commands

```bash
cd infra/terraform
terraform init
terraform fmt
terraform validate
terraform plan -var-file="terraform.tfvars"
terraform apply -auto-approve -var-file="terraform.tfvars"
```

Prepare variable file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

## 16. Azure Prerequisites Checklist

Before live deployment, ensure:

1. Azure subscription available
2. ACR available and reachable
3. AKS cluster available
4. GitHub OIDC app/federated credentials configured
5. Secrets configured in GitHub repository
6. Permissions granted to push image and deploy to AKS

## 17. Security Notes

1. CI/CD uses Azure login with OIDC (recommended over static secrets for auth)
2. Container images are scanned by Trivy prior to deploy
3. Backend service is internal-only in cluster (`ClusterIP`)
4. App Service Terraform uses managed identity + `AcrPull` role

## 18. Testing and Validation Performed

Validation executed during implementation:

1. Backend dependencies installed
2. Backend syntax check passed
3. Frontend dependencies installed
4. Frontend production build passed
5. Terraform `init` and `validate` passed

## 19. Troubleshooting Guide

1. Pipeline fails at Azure login
   - Verify OIDC setup and `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`

2. Pipeline fails at ACR push
   - Verify `ACR_NAME`, `ACR_LOGIN_SERVER`, and push permissions

3. Pipeline fails in Trivy stage
   - Review vulnerabilities and update base images/dependencies

4. AKS deploy succeeds but app unreachable
   - Check `frontend-svc` external IP and pod readiness

5. Backend API errors from frontend
   - Verify frontend NGINX proxy config in [frontend/nginx.conf](frontend/nginx.conf)

6. Terraform apply fails on role assignments
   - Ensure your identity can create role assignments at ACR scope

## 20. Demo Script (For Presentation)

1. Show app locally with `docker compose up --build`
2. Add/delete expense and show chart updates
3. Explain pipeline stages in [.github/workflows/cicd-aks.yml](.github/workflows/cicd-aks.yml)
4. Explain blue/green with service selector switch model
5. Explain rollback safety (no selector switch on failure)
6. Show Terraform resources and slot architecture in [infra/terraform/main.tf](infra/terraform/main.tf)

## 21. What You Can Claim in Interview

1. End-to-end ownership from code to deployment automation
2. CI/CD with security gates and quality controls
3. Kubernetes deployment strategy with zero-downtime cutover design
4. Infrastructure as Code with Terraform and deployment slots
5. Azure-ready implementation with clear production hardening path

## 22. Next Recommended Enhancements

1. Add HPA and PodDisruptionBudget for backend/frontend
2. Add Ingress + TLS instead of direct LoadBalancer
3. Add observability (Azure Monitor, Container Insights)
4. Move backend from file storage to managed database (Cosmos DB or PostgreSQL)
5. Add automated integration tests before deploy stage

# Updated

# Triggered by saidasari357 - Tue Apr 14 08:59:25 AM UTC 2026
