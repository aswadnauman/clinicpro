import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart,
  LogOut,
  Users,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import PatientsTab from '../components/PatientsTab';
import FeesTab from '../components/FeesTab';
import InventoryTab from '../components/InventoryTab';
import ReportsTab from '../components/ReportsTab';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${(amount || 0).toLocaleString()}`;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'fees', label: 'Fees & Payments', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div className="dashboard-header">
              <h1 className="dashboard-title">Dashboard Overview</h1>
              <p className="dashboard-subtitle">
                Welcome back, {user?.fullName}! Here's what's happening at your clinic today.
              </p>
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <StatsCard
                    title="Today's Revenue"
                    value={formatCurrency(stats.todayRevenue)}
                    icon={DollarSign}
                    color="green"
                    change="+12%"
                    changeType="positive"
                  />
                  <StatsCard
                    title="Today's Appointments"
                    value={stats.todayAppointments || 0}
                    icon={Calendar}
                    color="blue"
                    change="+5%"
                    changeType="positive"
                  />
                  <StatsCard
                    title="Pending Payments"
                    value={stats.pendingPayments || 0}
                    icon={AlertTriangle}
                    color="yellow"
                    change="2 new"
                    changeType="neutral"
                  />
                  <StatsCard
                    title="Low Stock Items"
                    value={stats.lowStockItems || 0}
                    icon={Package}
                    color="red"
                    change={stats.lowStockItems > 0 ? "Need attention" : "All good"}
                    changeType={stats.lowStockItems > 0 ? "negative" : "positive"}
                  />
                  <StatsCard
                    title="Total Patients"
                    value={stats.totalPatients || 0}
                    icon={Users}
                    color="blue"
                    change="Lifetime"
                    changeType="neutral"
                  />
                  <StatsCard
                    title="Charity Approvals"
                    value={stats.charityApprovals || 0}
                    icon={Heart}
                    color="yellow"
                    change={stats.charityApprovals > 0 ? "Pending review" : "All clear"}
                    changeType="neutral"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Recent Activity</h3>
                    </div>
                    <div className="card-content">
                      <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                        <Calendar size={48} style={{ margin: '0 auto 1rem' }} />
                        <p>Activity feed coming soon...</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                          Recent patient visits, payments, and inventory changes will appear here.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Quick Actions</h3>
                    </div>
                    <div className="card-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => setActiveTab('patients')}
                        >
                          <Users size={16} />
                          Add New Patient
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setActiveTab('fees')}
                        >
                          <DollarSign size={16} />
                          Record Payment
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setActiveTab('inventory')}
                        >
                          <Package size={16} />
                          Update Inventory
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setActiveTab('reports')}
                        >
                          <FileText size={16} />
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'patients':
        return <PatientsTab />;
      case 'fees':
        return <FeesTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Heart size={24} />
            SmallCare Clinic
          </div>
          <div className="user-info">
            <div className="user-details">
              <div className="user-name">{user?.fullName}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-sm">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar Navigation */}
        <nav className="sidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                {tab.label}
              </div>
            );
          })}
        </nav>

        {/* Main Content */}
        <main className="content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;