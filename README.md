# Flourmill-ERP: AI-Powered Enterprise Resource Planning System

## Software Requirements Specification (SRS)

**Version:** 1.0.0  
**Date:** April 3, 2026  
**Authors:** MillStream Development Team  

---

## Table of Contents

1. [Introduction](#introduction)
   - 1.1 [Purpose](#purpose)
   - 1.2 [Scope](#scope)
   - 1.3 [Definitions, Acronyms, and Abbreviations](#definitions-acronyms-and-abbreviations)
   - 1.4 [References](#references)
2. [Overall Description](#overall-description)
   - 2.1 [Product Perspective](#product-perspective)
   - 2.2 [Product Functions](#product-functions)
   - 2.3 [User Characteristics](#user-characteristics)
   - 2.4 [Constraints](#constraints)
   - 2.5 [Assumptions and Dependencies](#assumptions-and-dependencies)
3. [Specific Requirements](#specific-requirements)
   - 3.1 [External Interface Requirements](#external-interface-requirements)
   - 3.2 [Functional Requirements](#functional-requirements)
   - 3.3 [Non-Functional Requirements](#non-functional-requirements)
4. [System Architecture](#system-architecture)
5. [Data Model](#data-model)
6. [Setup and Installation](#setup-and-installation)
7. [Usage](#usage)
8. [API Documentation](#api-documentation)
9. [Contributing](#contributing)
10. [License](#license)

---

## 1. Introduction

### 1.1 Purpose

Flourmill-ERP is a comprehensive, AI-powered Enterprise Resource Planning (ERP) system specifically designed for flour mill operations. The system automates and optimizes key business processes including inventory management, customer vault accounts, transaction processing, demand forecasting, smart procurement, and intelligent customer support through AI-driven features.

The primary goals of Flourmill-ERP are to:
- Streamline flour mill operations through digital transformation
- Provide real-time insights into business performance
- Enable data-driven decision making with AI-powered analytics
- Ensure secure and efficient customer transaction management
- Automate routine tasks and reporting

### 1.2 Scope

Flourmill-ERP encompasses the following core functionalities:

**Core ERP Features:**
- User authentication and role-based access control (Admin/Customer)
- Customer vault account management for material storage
- Inventory tracking and reorder management
- Transaction processing (deposits, withdrawals, walk-in sales)
- Financial ledger and reporting
- Point of Sale (POS) system integration

**AI-Powered Features:**
- Demand forecasting using Facebook Prophet
- Smart procurement optimization with real-time commodity pricing
- Intelligent RAG (Retrieval-Augmented Generation) chat assistant
- Automated monthly financial report generation and email delivery

**Technical Infrastructure:**
- Microservices architecture with separate backend, AI service, and frontend
- PostgreSQL database with Prisma ORM
- Redis-based background job processing with BullMQ
- RESTful API design
- Modern React-based user interface

**Out of Scope:**
- Multi-mill management
- Advanced accounting integrations (e.g., SAP, QuickBooks)
- Mobile native applications
- Real-time market data beyond commodity prices

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| ERP | Enterprise Resource Planning |
| RAG | Retrieval-Augmented Generation |
| POS | Point of Sale |
| JWT | JSON Web Token |
| BullMQ | Redis-based job queue system |
| Prisma | Next-generation ORM for TypeScript & Node.js |
| FastAPI | Modern, fast web framework for building APIs with Python |
| Supabase | Open-source Firebase alternative |
| Upstash | Serverless Redis service |

### 1.4 References

- [SETUP.md](SETUP.md) - Complete setup and installation guide
- [Prisma Documentation](https://www.prisma.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Router Documentation](https://reactrouter.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Facebook Prophet Documentation](https://facebook.github.io/prophet/)

---

## 2. Overall Description

### 2.1 Product Perspective

Flourmill-ERP is a web-based ERP system that serves as a central hub for flour mill operations. It interfaces with external services for AI capabilities and data storage, while providing a unified interface for mill administrators and customers.

The system architecture follows a microservices pattern with three main components:
- **Backend Service**: Node.js/Express API handling business logic, database operations, and background jobs
- **AI Service**: Python/FastAPI microservice providing AI-powered features
- **Frontend**: React/Vite single-page application for user interaction

### 2.2 Product Functions

#### Core Business Functions
1. **User Management**
   - Admin and customer account creation
   - Role-based authentication and authorization
   - Password reset and security management

2. **Vault Account Management**
   - Customer material storage accounts (Wheat, Flour, Bran, Semolina)
   - Deposit and withdrawal transactions
   - Balance tracking and processing fee calculation

3. **Inventory Management**
   - Real-time stock tracking
   - Reorder threshold alerts
   - Category-based organization (Raw Materials, Processed Goods)

4. **Transaction Processing**
   - Secure transaction recording
   - Processing fee calculation and collection
   - Transaction history and reporting

5. **Reporting and Analytics**
   - Financial reports and dashboards
   - Automated monthly email reports
   - Transaction analytics and trends

#### AI-Powered Functions
1. **Demand Forecasting**
   - Historical data analysis using Prophet
   - Monthly demand predictions for wheat and flour
   - Revenue forecasting

2. **Smart Procurement**
   - Real-time commodity price monitoring (Alpha Vantage API)
   - Procurement recommendations based on market data
   - Price trend analysis

3. **Intelligent Chat Assistant**
   - Natural language queries about mill operations
   - RAG-based responses using database context
   - SQL query generation for complex data requests

### 2.3 User Characteristics

#### Admin Users
- Mill owners or managers
- Technical proficiency: Basic to intermediate
- Primary goals: Oversee operations, generate reports, manage customers
- Usage frequency: Daily

#### Customer Users
- Flour mill customers (farmers, businesses)
- Technical proficiency: Basic
- Primary goals: Manage vault accounts, view transactions, access services
- Usage frequency: Weekly to monthly

### 2.4 Constraints

#### Technical Constraints
- **Database**: PostgreSQL with Supabase hosting
- **Backend**: Node.js 18+ with Express framework
- **AI Service**: Python 3.11+ with FastAPI
- **Frontend**: React 18+ with Vite build tool
- **Authentication**: JWT-based session management
- **Job Queue**: Redis-based BullMQ for background processing

#### Business Constraints
- Processing fees: Configurable per material type (Flour: 2.5 PKR/kg, Bran: 1.0 PKR/kg, Semolina: 3.0 PKR/kg)
- Material types: Limited to Wheat, Flour, Bran, Semolina
- Currency: Pakistani Rupee (PKR)

#### Regulatory Constraints
- Data privacy compliance (customer information protection)
- Secure financial transaction handling
- Email communication for official reports

### 2.5 Assumptions and Dependencies

#### Assumptions
- Internet connectivity for external API integrations
- Valid API keys for third-party services (OpenAI, Alpha Vantage)
- Compatible web browsers (Chrome, Firefox, Safari, Edge)
- Sufficient server resources for concurrent users

#### Dependencies
- **External Services**:
  - Supabase PostgreSQL database
  - Upstash Redis (optional, for background jobs)
  - OpenAI API for RAG chat
  - Alpha Vantage API for commodity prices
  - Gmail SMTP for email reports

- **Software Dependencies**:
  - Node.js runtime environment
  - Python runtime environment
  - npm package manager
  - pip package manager

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### User Interfaces
- **Web Interface**: Responsive React application with Tailwind CSS styling
- **Admin Dashboard**: Comprehensive overview with charts and analytics
- **Customer Portal**: Simplified interface for account management
- **API Documentation**: Swagger/OpenAPI for backend and AI service endpoints

#### Hardware Interfaces
- **Database**: PostgreSQL connection via connection pooling
- **Cache/Queue**: Redis connection for background job processing
- **Email Service**: SMTP connection for automated reports

#### Software Interfaces
- **Database ORM**: Prisma Client for type-safe database operations
- **AI Models**: Integration with OpenAI GPT models and Facebook Prophet
- **Chart Rendering**: Chart.js for dashboard visualizations
- **Job Scheduling**: Node-cron for automated tasks

### 3.2 Functional Requirements

#### FR-1: User Authentication
- **Description**: System shall authenticate users with phone number and password
- **Priority**: High
- **Inputs**: Phone number, password
- **Outputs**: JWT token, user role
- **Pre-conditions**: Valid user account exists
- **Post-conditions**: User session established

#### FR-2: Vault Account Management
- **Description**: System shall manage customer material storage accounts
- **Priority**: High
- **Inputs**: Customer ID, material type, weight
- **Outputs**: Updated balance, transaction record
- **Processing**: Calculate processing fees, update inventory

#### FR-3: Transaction Processing
- **Description**: System shall process deposits, withdrawals, and sales transactions
- **Priority**: High
- **Inputs**: Transaction type, material details, quantities
- **Outputs**: Transaction confirmation, updated balances
- **Validation**: Sufficient balance for withdrawals, inventory availability

#### FR-4: Inventory Management
- **Description**: System shall track inventory levels and generate reorder alerts
- **Priority**: Medium
- **Inputs**: Stock updates, reorder thresholds
- **Outputs**: Current stock levels, low stock notifications

#### FR-5: Demand Forecasting
- **Description**: System shall predict future demand using historical data
- **Priority**: Medium
- **Inputs**: Historical transaction data
- **Outputs**: Monthly demand predictions, revenue forecasts
- **Algorithm**: Facebook Prophet time series analysis

#### FR-6: Smart Procurement
- **Description**: System shall provide procurement recommendations based on market data
- **Priority**: Medium
- **Inputs**: Current inventory, market prices
- **Outputs**: Procurement suggestions, price trends

#### FR-7: Intelligent Chat Assistant
- **Description**: System shall answer natural language queries about operations
- **Priority**: Medium
- **Inputs**: User questions in natural language
- **Outputs**: Contextual answers, generated SQL queries
- **Technology**: RAG with OpenAI GPT and database context

#### FR-8: Automated Reporting
- **Description**: System shall generate and email monthly financial reports
- **Priority**: Medium
- **Inputs**: Transaction data, time period
- **Outputs**: PDF reports, email delivery
- **Scheduling**: Monthly cron job execution

### 3.3 Non-Functional Requirements

#### Performance Requirements
- **Response Time**: API responses < 2 seconds for 95% of requests
- **Concurrent Users**: Support up to 100 simultaneous users
- **Database Queries**: Optimized queries with proper indexing
- **AI Processing**: Forecasting models complete within 30 seconds

#### Security Requirements
- **Authentication**: JWT tokens with 7-day expiration
- **Password Storage**: bcrypt hashing with salt rounds
- **Data Encryption**: TLS 1.3 for all communications
- **Access Control**: Role-based permissions (Admin/Customer)

#### Reliability Requirements
- **Uptime**: 99.5% availability target
- **Data Backup**: Automated database backups via Supabase
- **Error Handling**: Comprehensive error logging and graceful degradation
- **Transaction Integrity**: ACID compliance for financial operations

#### Usability Requirements
- **Interface Design**: Intuitive navigation with clear visual hierarchy
- **Responsive Design**: Compatible with desktop and mobile devices
- **Accessibility**: WCAG 2.1 AA compliance
- **User Feedback**: Clear success/error messages and loading states

#### Maintainability Requirements
- **Code Quality**: ESLint and type checking enabled
- **Documentation**: Comprehensive API documentation
- **Modular Design**: Microservices architecture for independent deployment
- **Version Control**: Git-based development with semantic versioning

---

## 4. System Architecture

Flourmill-ERP follows a microservices architecture with three main components:

### Backend Service (Node.js/Express)
- **Framework**: Express.js with middleware architecture
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: JWT-based session management
- **Background Jobs**: BullMQ with Redis
- **Email Service**: Nodemailer with Gmail SMTP
- **API Design**: RESTful endpoints with consistent error handling

### AI Service (Python/FastAPI)
- **Framework**: FastAPI with automatic OpenAPI documentation
- **AI Models**: 
  - Facebook Prophet for time series forecasting
  - OpenAI GPT for natural language processing
  - LangChain for RAG implementation
- **Data Access**: SQLAlchemy with async PostgreSQL connections
- **External APIs**: Alpha Vantage for commodity prices

### Frontend (React/Vite)
- **Framework**: React 18 with hooks and functional components
- **Routing**: React Router for single-page application navigation
- **State Management**: Zustand for global state
- **UI Components**: Tailwind CSS with custom component library
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios for API communication

### Infrastructure Components
- **Database**: Supabase PostgreSQL with connection pooling
- **Cache/Queue**: Upstash Redis (optional for background jobs)
- **Deployment**: Container-ready with Docker support
- **Monitoring**: Health check endpoints and error logging

---

## 5. Data Model

The system uses PostgreSQL with the following core entities:

### User Management
- **User**: Authentication and role information
- **CustomerProfile**: Extended customer details and mill ID

### Business Operations
- **VaultAccount**: Customer material storage balances
- **Inventory**: Stock levels and reorder thresholds
- **TransactionLedger**: Complete transaction history

### AI Features
- **AI_Forecasts**: Generated demand predictions
- **CommodityPrices**: Market price data from external APIs

### Key Relationships
- User (1:1) CustomerProfile
- CustomerProfile (1:M) VaultAccount
- CustomerProfile (1:M) TransactionLedger
- VaultAccount references MaterialType enum
- Inventory references Category enum

---

## 6. Setup and Installation

For detailed setup and installation instructions, please refer to [SETUP_AND_RUN.md](SETUP_AND_RUN.md).

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL database (Supabase recommended)
- Redis (Upstash recommended, optional)

### Quick Start
1. Clone the repository
2. Set up external services (Supabase, Upstash, API keys)
3. Configure environment variables
4. Install dependencies and run database migrations
5. Start the services

---

## 7. Usage

### Admin Workflow
1. **Login**: Access admin dashboard with credentials
2. **Customer Management**: Create/manage customer accounts
3. **Inventory Oversight**: Monitor stock levels and reorder alerts
4. **Transaction Review**: View and manage all transactions
5. **Reports**: Generate financial reports and analytics
6. **AI Insights**: Review demand forecasts and procurement recommendations

### Customer Workflow
1. **Registration**: Create account with phone number
2. **Vault Management**: Deposit/withdraw materials
3. **Transaction History**: View past transactions and balances
4. **AI Assistant**: Query system for information and support

### AI Features Usage
- **Forecasting**: Automatic monthly predictions (accessible via dashboard)
- **Procurement**: Real-time price monitoring and recommendations
- **Chat Assistant**: Natural language queries in the AI Assistant interface

---

## 8. API Documentation

### Backend API (Port 5000)
- **Authentication**: `/api/auth/*`
- **Customers**: `/api/customers/*`
- **Vault**: `/api/vault/*`
- **Admin**: `/api/admin/*`
- **Sales**: `/api/sales/*`
- **Ledger**: `/api/ledger/*`
- **Inventory**: `/api/inventory/*`
- **AI Integration**: `/api/ai/*`

### AI Service API (Port 8000)
- **Forecasting**: `/forecast/*`
- **Procurement**: `/procurement/*`
- **Chat**: `/chat/*`
- **Health**: `/health`

### Frontend API Integration
- Axios-based HTTP client with interceptors
- Automatic token refresh and error handling
- Real-time data synchronization

---

## 9. Contributing

### Development Setup
1. Follow the setup guide in [SETUP_AND_RUN.md](SETUP_AND_RUN.md)
2. Use the provided ESLint and Prettier configurations
3. Write tests for new features
4. Follow conventional commit messages
5. Create pull requests with detailed descriptions

### Code Standards
- **Backend**: ESLint configuration, consistent error handling
- **AI Service**: Type hints, docstrings, async/await patterns
- **Frontend**: React best practices, component composition
- **Database**: Prisma migrations, data validation

### Testing
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user workflows
- AI model validation and accuracy testing

---

## 10. License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**For technical support or questions, please refer to the [SETUP.md](SETUP.md) guide or create an issue in the repository.**
