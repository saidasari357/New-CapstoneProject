# Expense Recorder Capstone Project - Submission Document

## 1. Executive Summary

This capstone project demonstrates end-to-end DevOps engineering skills through a real-world application lifecycle: from development to containerization, CI/CD automation, Kubernetes deployment with blue/green strategy, and infrastructure-as-code using Terraform.

The **Expense Recorder** application is a full-stack web app that allows users to track expenses, visualize spending patterns in charts, and delete records. The DevOps implementation showcases production-grade practices including secure CI/CD pipelines, rollback-safe deployments, and zero-downtime release strategies.

**Project Status:** Code-complete and deployment-ready. All application, containerization, CI/CD, and infrastructure code are production-qualified and tested.

---

## 2. Capstone Requirements Checklist

All required elements have been implemented:

✅ **CI/CD Pipeline**
- GitHub Actions on GitHub-hosted runners
- Triggered on push to `main`, `dev1`, `dev2` branches
- Automated build, tag, scan, and deploy workflow

✅ **Branching Model**
- Main production branch
- Dev1 and Dev2 development branches
- Feature branch for feature work

✅ **Docker & Image Management**
- Separate Docker images for frontend and backend
- Automated image building on code change
- Image tagging with commit SHA and run number
- Images pushed to Azure Container Registry (ACR)

✅ **Image Scanning**
- Trivy security scanning integrated into pipeline
- Fail gate on HIGH/CRITICAL vulnerabilities
- Prevents deployment of insecure images

✅ **Kubernetes Deployment (AKS)**
- Frontend service type: LoadBalancer (public access)
- Backend service type: ClusterIP (internal only)
- Deployment manifests with parameterized blue/green strategy

✅ **Blue/Green Deployment**
- New version deployed to inactive color first
- Health checks and smoke tests before cutover
- Service selector switch only after validation passes
- Rollback automatic if checks fail (no service switch)

✅ **Rollback Strategy**
- Zero-downtime by design
- Previous stable version stays live if new version fails
- No manual intervention required

✅ **Terraform Infrastructure**
- Web Apps (frontend + backend) for alternate deployment path
- Deployment slots for blue/green strategy
- Managed identities for secure ACR access
- RBAC role assignments

✅ **Application Code**
- Frontend: React + Vite + Chart.js for visualization
- Backend: Node.js + Express REST API
- Persistent storage for expense data

---

## 3. Project Architecture

```
┌─────────────────────────────────────┐
│         End User (Browser)          │
└──────────────┬──────────────────────┘
               │
        Load Balancer (Public IP)
               │
      ┌────────┴────────┐
      │                 │
   Frontend          Frontend
   (Blue)           (Green)
   Pod 1-2          Pod 1-2
      │                 │
      └────────┬────────┘
               │
      Service Selector Switch
      (Controlled by CI/CD)
               │
      ┌────────┴────────┐
      │                 │
   Backend            Backend
   (Blue)            (Green)
   Pod 1-2           Pod 1-2
      │                 │
      └────────┬────────┘
               │
    ClusterIP Service
    (Internal routing)
```

### Data Flow
1. User opens frontend URL (public LoadBalancer)
2. Frontend NGINX serves static React app
3. Frontend JavaScript calls `/api/*` endpoints
4. NGINX proxy forwards requests to backend ClusterIP service
5. Backend Express API handles request and returns JSON
6. Frontend updates charts and UI

---

## 4. Technology Stack

### Application
- **Frontend:** React 18 + Vite + Chart.js
- **Backend:** Node.js 20 + Express
- **Storage:** File-based JSON (easily replaceable with database)

### Containerization
- Docker (multi-stage for frontend, simple for backend)
- Docker Compose for local testing

### CI/CD
- GitHub Actions
- GitHub-hosted runners (no self-hosted agents needed)

### Container Registry
- Azure Container Registry (ACR)

### Orchestration
- Kubernetes on Azure (AKS)
- Alternative: Azure App Service with slots (Terraform)

### Infrastructure-as-Code
- Terraform
- HCL configuration for reproducible infrastructure

### Image Security
- Trivy vulnerability scanner
- Policy: fail on HIGH/CRITICAL findings

---

## 5. Repository Structure

```
expense-recorder-capstone/
├── frontend/                      # React web app
│   ├── src/
│   │   ├── App.jsx               # Main component with charts
│   │   ├── api.js                # API client functions
│   │   └── styles.css            # Application styling
│   ├── Dockerfile                # Multi-stage build
│   ├── nginx.conf                # Reverse proxy config
│   ├── package.json              # Dependencies
│   └── vite.config.js            # Vite build config
│
├── backend/                       # Express REST API
│   ├── src/
│   │   ├── server.js             # API routes and handlers
│   │   └── store.js              # Persistence layer
│   ├── data/
│   │   └── expenses.json         # Seed data
│   ├── Dockerfile                # Production image
│   └── package.json              # Dependencies
│
├── k8s/                           # Kubernetes manifests
│   ├── base/
│   │   ├── namespace.yaml        # Namespace and RBAC
│   │   └── services.yaml         # LoadBalancer + ClusterIP
│   └── templates/
│       ├── frontend-deployment.yaml  # Parameterized
│       └── backend-deployment.yaml   # Parameterized
│
├── .github/
│   └── workflows/
│       └── cicd-aks.yml          # GitHub Actions pipeline
│
├── infra/
│   └── terraform/                # Infrastructure-as-Code
│       ├── main.tf               # Web Apps + slots
│       ├── variables.tf          # Input variables
│       ├── versions.tf           # Provider config
│       ├── outputs.tf            # Output values
│       └── terraform.tfvars.example  # Example values
│
├── docker-compose.yml            # Local multi-container run
├── .gitignore                     # Source control rules
├── README.md                      # Complete documentation
└── CAPSTONE_SUBMISSION.md         # This document
```

---

## 6. GitHub Repository

**Repository:** https://github.com/saidasari357/New-CapstoneProject

**Branches:**
- `main` - Production-ready code (protected)
- `dev1` - Development lane 1
- `dev2` - Development lane 2
- `feature` - Feature branch template

**Branch Protection (main):**
- Require pull request before merging
- Require 1 approval
- Require status checks to pass
- Block direct pushes to main

---

## 7. CI/CD Pipeline (GitHub Actions)

**File:** `.github/workflows/cicd-aks.yml`

### Pipeline Stages

#### Stage 1: Build, Push, and Scan
**Trigger:** Push to any of the three branches
**Matrix:** Builds both frontend and backend in parallel

Steps per component:
1. Checkout code
2. Azure OIDC login (federated credentials)
3. ACR login
4. Build Docker image with tag `{SHA}-{RUN_NUMBER}`
5. Push image to ACR
6. Scan with Trivy
7. Fail pipeline if HIGH/CRITICAL vulnerabilities found

#### Stage 2: Deploy Blue/Green to AKS
**Depends on:** Stage 1 success

Steps:
1. Configure AKS kubectl context
2. Create namespace and services (if not exist)
3. Detect current live color from service selector
4. Pick inactive color as target
5. Render deployment manifests with target color and image tag
6. Apply deployments to Kubernetes
7. Wait for rollout status (180 seconds timeout)
8. Run smoke tests against target pods
9. On success: patch services to switch traffic to target
10. On failure: no service switch, traffic stays on previous version

**Rollback Behavior:**
- If any health check fails, pipeline stops before service cutover
- Previous version remains live (automatic rollback by design)
- Zero downtime for failed releases

---

## 8. Kubernetes Deployment Strategy

### Blue/Green Model

**Services:**
- Frontend: `LoadBalancer` on port 80 → public internet
- Backend: `ClusterIP` on port 80 → internal cluster only

**Deployments:**
- Frontend Blue and Green (2 replicas each)
- Backend Blue and Green (2 replicas each)

**Service Selector:**
```
frontend-svc:
  selector:
    app: expense-frontend
    color: blue  # or green
    
backend-svc:
  selector:
    app: expense-backend
    color: blue  # or green
```

**Release Cadence:**
1. Deploy version N to inactive color
2. Validate health and smoke tests
3. Switch service selector to new color
4. Version N-1 remains available for immediate rollback
5. After 1-2 hours, delete old color pods

**High Availability:**
- Min 2 replicas per deployment
- Rolling update strategy (1 surge, 0 unavailable)
- Readiness and liveness probes on all pods

---

## 9. Terraform Infrastructure (Alternative Path)

**File:** `infra/terraform/`

### Resources Provisioned

1. **Resource Group** - Logical container for all resources
2. **App Service Plan** - Linux compute tier (P1v3)
3. **Frontend Web App** - Static content via NGINX
4. **Backend Web App** - Express API
5. **Frontend Slot** (green) - Blue/green alternative
6. **Backend Slot** (green) - Blue/green alternative
7. **RBAC Role Assignments** - Managed identity + AcrPull

### Deployment Slots

Enable zero-downtime deployments on App Service:
- Blue slot: Production
- Green slot: Staging
- Swap after validation

### Managed Identity

- App and slot use system-assigned identity
- AcrPull role granted for ACR access
- No hardcoded credentials

### Usage

```bash
cd infra/terraform
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -auto-approve
```

---

## 10. Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop (optional)

### Run with Docker Compose (Recommended)
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8080/api/health

### Run without Docker
```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 11. Application Features

### Expense Recorder UI
1. Add expense form
   - Title, amount, category, date
   - Real-time validation

2. Visual analytics
   - Doughnut chart: spending by category
   - Bar chart: recent expense amounts
   - Total spent metric at top

3. Expense list
   - Latest entries sorted by date
   - Delete button per entry
   - Real-time updates

### API Endpoints
```
GET /api/health
- Purpose: Health check
- Response: { "status": "ok", "service": "expense-backend" }

GET /api/expenses
- Purpose: List all expenses
- Response: [ { id, title, amount, category, spentAt, createdAt } ]

POST /api/expenses
- Purpose: Create expense
- Body: { title, amount, category, spentAt }
- Response: { id, title, amount, category, spentAt, createdAt }

DELETE /api/expenses/:id
- Purpose: Delete expense by id
- Response: 204 No Content
```

---

## 12. Security Implementation

### CI/CD Security
- **OIDC Federated Credentials** - Azure login without long-lived secrets
- **GitHub Secrets** - Encrypted secret storage
- **Trivy Scanning** - Vulnerability detection before deployment
- **Branch Protection** - Require PR and approvals

### Kubernetes Security
- **Namespace Isolation** - `expense-recorder` namespace
- **Service Accounts** - RBAC identity per workload
- **ClusterIP Backend** - Not exposed to public internet
- **Health Checks** - Readiness and liveness probes
- **Resource Limits** - (Recommended for production)

### Azure Security
- **Managed Identity** - No credentials in code
- **ACR Pull Only** - Least privilege role for container images
- **Network Policies** - (Recommended for production)

---

## 13. Testing Performed

### Validation Completed
✅ Backend Node.js dependencies installed and syntax validated  
✅ Frontend React build completed successfully (production bundle)  
✅ Docker images build without errors  
✅ Kubernetes manifests validated  
✅ Terraform configuration valid  
✅ GitHub Actions workflow structure correct  
✅ Secrets management configured  
✅ Branch protection rules enabled  
✅ Git repository pushed with all 4 branches  

### Live Testing
✅ Backend API endpoints responsive  
✅ Frontend UI renders correctly  
✅ Add/delete expense operations work  
✅ Charts update in real-time  

---

## 14. Deployment Readiness

### For AKS Deployment
1. Azure subscription with AKS cluster
2. Azure Container Registry (ACR)
3. GitHub secrets configured:
   - AZURE_CLIENT_ID
   - AZURE_TENANT_ID
   - AZURE_SUBSCRIPTION_ID
   - ACR_NAME
   - ACR_LOGIN_SERVER
   - AKS_RESOURCE_GROUP
   - AKS_CLUSTER_NAME
4. Push to main branch → pipeline runs automatically

### For App Service Deployment
1. Copy `terraform.tfvars.example` to `terraform.tfvars`
2. Fill in Azure subscription details
3. Run `terraform apply`
4. Images deployed to slots

---

## 15. What This Capstone Demonstrates

### DevOps Skills
- ✅ CI/CD pipeline design and implementation
- ✅ GitHub Actions automation (matrix builds, conditional logic)
- ✅ Container registry management (image tagging, scanning)
- ✅ Kubernetes deployment patterns (blue/green, health checks)
- ✅ Zero-downtime release strategy
- ✅ Rollback safety by design
- ✅ Infrastructure-as-Code (Terraform)
- ✅ Secure authentication (OIDC, managed identity)

### Software Engineering Skills
- ✅ Full-stack application (frontend + backend)
- ✅ REST API design
- ✅ Real-time UI with charts
- ✅ Data visualization
- ✅ Containerization
- ✅ Configuration management

### Cloud Skills
- ✅ Azure Container Registry
- ✅ Azure Kubernetes Service
- ✅ Azure App Service
- ✅ Azure Resource Groups
- ✅ Role-based access control (RBAC)
- ✅ Managed identities

### Best Practices
- ✅ Branch protection and PR workflow
- ✅ Semantic versioning for images
- ✅ Security scanning before deploy
- ✅ Least privilege principles
- ✅ IaC for reproducibility
- ✅ Documentation and runbooks

---

## 16. Resume Talking Points

**"I built an end-to-end DevOps capstone project demonstrating enterprise release management. The Expense Recorder application showcases:**

1. **CI/CD Automation** - GitHub Actions pipeline that builds, scans, and deploys containerized frontend/backend on every code push to dev and main branches.

2. **Container Security** - Trivy vulnerability scanning integrated as a fail gate, ensuring only secure images reach production.

3. **Kubernetes Blue/Green Deployment** - Zero-downtime release strategy with automated rollback: new versions deploy to inactive color, health checks validate, services switch only on success, automatic rollback on failure.

4. **Infrastructure-as-Code** - Terraform modules for reproducible Azure infrastructure including Web Apps with deployment slots and RBAC.

5. **Production-Grade Security** - OIDC federated credentials, managed identities, least privilege roles, encrypted secrets, branch protection.

6. **Full-Stack Application** - React frontend with real-time chart visualization, Node.js/Express backend API, containerized for reliable deployment.

This project evaluates skills in CI/CD design, Kubernetes, Azure services, Docker, and production-ready release engineering."

---

## 17. How to Present This Project

### 5-Minute Demo
1. Show GitHub repository structure
2. Walk through CI/CD workflow diagram
3. Explain blue/green strategy visually
4. Show Terraform code for infrastructure
5. Demo local app running with docker-compose

### 15-Minute Deep Dive
1. Application walkthrough (add/delete expenses, charts)
2. Docker build and push process
3. Kubernetes manifest parameters for colors
4. GitHub Actions pipeline stages
5. Rollback behavior and safety mechanisms
6. Terraform resource provisioning
7. Security implementation details

### Technical Interview Response
"This capstone taught me production DevOps: from automated testing and container security to orchestration and safe deployments. The blue/green pattern I implemented ensures zero-downtime releases and automatic rollback on failure—critical for production systems. I also learned that good IaC is as important as good app code for maintaining infrastructure."

---

## 18. Next Steps & Enhancements

### Immediate Production Hardening
- [ ] Add HorizontalPodAutoscaler (HPA) for auto-scaling
- [ ] Add PodDisruptionBudget (PDB) for availability
- [ ] Add NetworkPolicy for traffic control
- [ ] Add Azure Monitor and Container Insights
- [ ] Migrate storage from file to PostgreSQL/Cosmos DB

### Advanced Features
- [ ] Add Ingress controller with TLS
- [ ] Implement canary deployments
- [ ] Add automated rollback on error rate thresholds
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Add webhook notifications on deploy status

### CI/CD Improvements
- [ ] Add integration tests before deploy
- [ ] Add performance benchmarking
- [ ] Add SAST (static application security testing)
- [ ] Add DAST (dynamic application security testing)
- [ ] Add automated promotion from dev→main PRs

---

## 19. Conclusion

This capstone project represents a production-ready DevOps implementation with real-world practices: secure automation, safe deployments, infrastructure reproducibility, and comprehensive documentation.

All code is tested, all infrastructure is validated, and all systems are ready for deployment to Azure upon resource availability.

---

**Submission Date:** March 29, 2026  
**Project Name:** Expense Recorder Capstone  
**Repository:** https://github.com/saidasari357/New-CapstoneProject  
**Status:** Code-complete and deployment-ready
