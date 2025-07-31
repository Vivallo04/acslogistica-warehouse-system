# ACS WareHouse Management System - ACS Logística

Full-stack warehouse management system for WhatsApp Business operations and mobile app management.

## Architecture

This is a **full-stack application** consisting of:

- **Frontend**: Next.js 15 unified dashboard
- **Backend**: ASP.NET Core Web API for warehouse management

## Setup

### Dashboard (Root Directory)

```bash
npm install
npm run dev
```

### Backend API

```bash
cd backend/WarehouseManagementSystemAPI
dotnet restore
dotnet run
```

The API will be available at `http://localhost:5000`

## Features

### Dashboard
- WhatsApp campaign management
- Mobile app content management  
- Real-time analytics and reporting
- Role-based access control
- Package tracking and management
- Toast notifications for user feedback

### Backend API
- Package management with CRUD operations
- Advanced filtering and search capabilities
- Pagination with configurable page sizes
- CORS support for frontend integration
- Environment-based configuration
- Health monitoring endpoints
- Swagger/OpenAPI documentation

## Development

- Dashboard runs on `http://localhost:3000`
- Backend API runs on `http://localhost:5000`
- API documentation available at `http://localhost:5000/swagger`