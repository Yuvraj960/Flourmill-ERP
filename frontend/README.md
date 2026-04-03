# MillStream ERP - UI Design System

A complete UI/UX design system for MillStream ERP, an AI-enhanced Enterprise Resource Planning application for flour mill operations.

## 📋 Overview

This project contains the complete visual designs for all pages specified in the MillStream ERP Product Requirements Document (PRD). All pages are fully designed with realistic mock data and interactive components.

## 🎨 Pages Included

### Authentication (2 pages)
- **Login** (`/login`) - Phone-based authentication with demo credentials
- **Register** (`/register`) - Customer self-registration with auto-generated Mill ID

### Admin Portal (9 pages)
- **Dashboard** (`/admin/dashboard`) - KPIs, charts, recent activity, and alerts
- **Vault Management** (`/admin/vault`) - Process deposits/withdrawals for customers
- **Inventory** (`/admin/inventory`) - Monitor and adjust stock levels
- **Point of Sale** (`/admin/pos`) - Retail transaction processing
- **Transactions** (`/admin/transactions`) - Complete transaction ledger with filters
- **Customers** (`/admin/customers`) - Customer management with password retrieval
- **AI Assistant** (`/admin/ai-assistant`) - Natural language database querying (RAG)
- **Forecasting** (`/admin/forecasting`) - AI demand predictions & procurement advice
- **Reports** (`/admin/reports`) - Automated monthly reports via BullMQ

### Customer Portal (3 pages)
- **Dashboard** (`/customer/dashboard`) - Vault balance, Mill ID, and activity charts
- **Transactions** (`/customer/transactions`) - Personal transaction history
- **Profile** (`/customer/profile`) - Account information and statistics

### Utility Pages (2 pages)
- **404 Not Found** (`/404`) - Error page for missing routes
- **403 Unauthorized** (`/unauthorized`) - Access denied page

## 🔑 Key Features Demonstrated

### Admin Features
- **Real-time KPIs** with trend indicators
- **Interactive charts** using Recharts
- **Vault operations** with deposit/withdrawal flows
- **Inventory management** with stock level alerts
- **POS system** with shopping cart functionality
- **Customer management** with plaintext password retrieval (as per PRD)
- **AI chatbot interface** with SQL query visualization
- **Demand forecasting** with Prophet/SARIMA model outputs
- **Procurement recommendations** based on market prices
- **Automated report scheduling** with BullMQ visualization

### Customer Features
- **Mill ID display** with copy functionality
- **Vault balance** tracking
- **Transaction history** with filters
- **Activity charts** showing deposit/withdrawal trends
- **Read-only access** to personal data

### Design System
- **Consistent color scheme** with blue/green/purple accents
- **Responsive layouts** for desktop and tablet
- **Interactive components** with hover states
- **Toast notifications** for user feedback
- **Badge system** for status indicators
- **Card-based layouts** for content organization

## 🚀 Demo Credentials

### Admin Account
- Phone: `+1234567890`
- Password: `admin123`

### Customer Account
- Phone: `+1234569876`
- Password: `customer123`
- Mill ID: `YUV-9876`

## 🛠️ Technology Stack

- **React** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Recharts** for data visualization
- **Lucide React** for icons
- **Sonner** for toast notifications

## 📊 Mock Data

All pages use realistic mock data from `/src/app/data/mockData.ts` including:
- 5 customer accounts
- 6+ transaction records
- 4 inventory items
- AI forecasting data
- Monthly reports archive

## 🎯 PRD Alignment

This design system accurately represents all features specified in the MillStream ERP PRD:

✅ Phone-based authentication  
✅ Auto-generated Mill IDs (e.g., YUV-9876)  
✅ Plaintext password retrieval for admins  
✅ Vault deposit/withdrawal processing  
✅ Inventory tracking (raw vs processed)  
✅ POS for retail customers  
✅ AI demand forecasting (Prophet/SARIMA)  
✅ Smart procurement recommendations  
✅ RAG chatbot for natural language queries  
✅ Automated monthly reports (BullMQ)  
✅ Role-based access control (Admin/Customer)  

## 📝 Notes

- This is a **design-only implementation** with mock data
- No backend database or authentication is connected
- All interactions use simulated responses
- Perfect for presentations, demos, and UI/UX review
