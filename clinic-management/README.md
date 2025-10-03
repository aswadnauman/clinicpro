# SmallCare Clinic Management System

A comprehensive, intuitive web application designed specifically for small clinics to manage patients, fees, inventory, and generate insightful reports.

## ✨ Features

### 🏥 Core Modules

1. **User Roles & Access Control**
   - Receptionist: Manages appointments, patient records, fee collection, prescription uploads
   - Doctor: Views patient history, adds medical notes, approves fee amounts and charity discounts
   - Admin: Manages inventory, expenses, staff advances, generates all reports

2. **Patient Management**
   - Complete patient profiles with medical history
   - Prescription & document upload system
   - Chronological medical records with auto-tagging
   - Patient visit tracking and scheduling

3. **Fee & Charity Management**
   - Doctor-approved fee setting with charity discounts
   - Automated charity case approval workflow
   - Payment collection with multiple payment methods
   - Complete payment history and pending payment tracking

4. **Simple Accounting (Non-Accountant Friendly)**
   - Daily expense tracking by categories
   - Staff advances and receivables management
   - Asset tracking for clinic equipment
   - No complex accounting jargon - uses terms like "Money In," "Money Out," "What We Owe"

5. **Inventory Management**
   - Medical supplies stock tracking
   - Low-stock alerts with customizable thresholds
   - Expiry date monitoring
   - Usage logs linked to patient visits

6. **Visual Reports & Analytics**
   - Interactive charts and graphs (bar, pie, line charts)
   - Revenue dashboard with date-range filters
   - Expense tracking with category breakdown
   - Patient insights and inventory health reports
   - Exportable data for external use

### 📱 Technical Features

- **Mobile-Friendly**: Fully responsive design for tablets and phones
- **Real-time Data**: Auto-updating dashboard and statistics
- **Role-based Security**: Secure access control based on user roles
- **File Upload**: Support for prescription images, lab reports, and documents
- **Data Safety**: Secure authentication and data protection

## 🚀 Technology Stack

- **Frontend**: React 18+ with Vite, Recharts for analytics, Lucide React for icons
- **Backend**: Node.js with Express.js
- **Database**: SQLite for simplicity and portability
- **Authentication**: JWT-based authentication with bcrypt
- **File Handling**: Multer for file uploads
- **UI/UX**: Custom CSS with responsive design

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone and Setup

```bash
cd clinic-management
npm install
cd client
npm install
cd ..
```

### 2. Database Initialization

The database will be automatically created when you first run the server. The schema includes sample data with demo users:

- **Admin**: username: `admin`, password: `admin123`
- **Doctor**: username: `dr_smith`, password: `admin123`
- **Receptionist**: username: `receptionist`, password: `admin123`

### 3. Start the Application

**Option 1: Development Mode (Recommended)**

In one terminal (Backend):
```bash
npm run dev
```

In another terminal (Frontend):
```bash
cd client
npm run dev
```

**Option 2: Production Mode**
```bash
npm start  # Starts backend
cd client && npm run build && npm run preview  # Builds and serves frontend
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👤 User Roles & Permissions

### Receptionist
- ✅ Add and edit patient records
- ✅ Schedule appointments
- ✅ Upload medical documents
- ✅ Collect payments
- ❌ Cannot approve charity cases
- ❌ Cannot access inventory management

### Doctor
- ✅ View all patient records
- ✅ Add medical notes and diagnosis
- ✅ Set fee amounts and charity discounts
- ✅ Approve charity cases
- ✅ Upload prescriptions and medical documents
- ❌ Cannot manage inventory or expenses

### Admin
- ✅ Full access to all modules
- ✅ Manage inventory and stock levels
- ✅ Track expenses and receivables
- ✅ Generate all reports
- ✅ Approve charity cases
- ✅ Manage user accounts

## 🎯 Example User Flow

1. **Patient Registration**: Receptionist adds new patient → System generates unique Patient ID (P-001, P-002, etc.)

2. **Consultation**: Doctor consults patient → Sets fee (Rs. 100) with 20% charity discount → System requests approval

3. **Charity Approval**: Admin/Doctor approves charity case → Final fee becomes Rs. 80

4. **Payment Collection**: Receptionist collects Rs. 80 → System auto-logs payment with method and date

5. **Medical Records**: Doctor uploads prescription image → System auto-tags with date, doctor name, and visit reason

6. **Reporting**: Monthly report shows Rs. 80 under "Charity-Adjusted Revenue" with complete audit trail

## 📊 Dashboard Features

### Summary Cards (Real-time)
- Today's Revenue
- Pending Payments
- Low Stock Items
- Total Patients
- Charity Cases Pending Approval

### Interactive Reports
- **Revenue Analysis**: Daily/monthly trends, charity vs. paid breakdown
- **Expense Tracking**: Categorized spending, monthly comparisons
- **Patient Insights**: Visit frequency, top patients by visits
- **Inventory Health**: Stock levels, expiry alerts, usage rates

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Secure file upload validation
- SQL injection protection
- CORS and security headers

## 📁 Project Structure

```
clinic-management/
├── server/                 # Backend Express.js application
│   ├── app.js             # Main server file
│   └── routes/            # API route handlers
│       ├── fees.js        # Fee and charity management
│       ├── inventory.js   # Inventory management
│       └── accounting.js  # Expenses, receivables, assets
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Main page components
│   │   ├── contexts/      # React context providers
│   │   └── utils/         # Utility functions
│   └── public/           # Static assets
├── database/             # Database schema and migrations
│   └── schema.sql        # Complete database schema
├── uploads/              # File upload storage
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

### Database Configuration

The application uses SQLite for simplicity. The database file will be created automatically at `database/clinic.db`.

## 📈 Sample Data

The application includes sample data:
- Demo users with different roles
- Sample inventory items (medicines, consumables)
- Example expense categories
- Pre-configured settings

## 🚀 Deployment

### Local Deployment
1. Build the frontend: `cd client && npm run build`
2. Start the server: `npm start`
3. Access at http://localhost:5000

### Production Deployment
- Supports deployment on any Node.js hosting service
- SQLite database is portable and requires no additional setup
- Environment variables should be configured for production

## 🔄 Backup & Data Safety

- Automatic database initialization
- Role-based data access
- Regular backup recommendations for the SQLite database file
- All critical operations are logged with timestamps and user information

## 🤝 Contributing

This is a specialized clinic management system. For feature requests or bug reports, please follow the standard Git workflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 💡 Key Design Principles

1. **Simplicity First**: No complex accounting jargon or overcomplicated workflows
2. **Visual Clarity**: Rich charts and graphs for easy data interpretation
3. **Mobile-Ready**: Works seamlessly on tablets and phones
4. **Role-Based**: Each user sees only what they need to see
5. **Real-Time**: Live updates and instant feedback
6. **Audit Trail**: Complete tracking of all transactions and changes

---

Built with ❤️ for small clinics to digitize their operations efficiently.