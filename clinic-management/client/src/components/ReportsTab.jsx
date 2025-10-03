import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Heart,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';

const ReportsTab = () => {
  const [activeReport, setActiveReport] = useState('revenue');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    to: new Date().toISOString().split('T')[0]
  });
  const [revenueData, setRevenueData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [patientData, setPatientData] = useState([]);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'revenue', label: 'Revenue Analysis', icon: DollarSign },
    { id: 'expenses', label: 'Expense Tracking', icon: BarChart3 },
    { id: 'patients', label: 'Patient Insights', icon: Users },
    { id: 'inventory', label: 'Inventory Health', icon: Package },
  ];

  useEffect(() => {
    loadReportData();
  }, [activeReport, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      switch (activeReport) {
        case 'revenue':
          await loadRevenueData();
          break;
        case 'expenses':
          await loadExpenseData();
          break;
        case 'patients':
          await loadPatientData();
          break;
        case 'inventory':
          await loadInventoryData();
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      const response = await axios.get('/api/fees/analytics/revenue', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to,
          group_by: 'day'
        }
      });
      setRevenueData(response.data);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      setRevenueData([]);
    }
  };

  const loadExpenseData = async () => {
    try {
      const response = await axios.get('/api/accounting/expenses/categories', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to
        }
      });
      setExpenseData(response.data);
    } catch (error) {
      console.error('Error loading expense data:', error);
      setExpenseData([]);
    }
  };

  const loadPatientData = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, we'll simulate patient visit data
      setPatientData([
        { date: '2024-01-01', visits: 12, newPatients: 3 },
        { date: '2024-01-02', visits: 8, newPatients: 1 },
        { date: '2024-01-03', visits: 15, newPatients: 4 },
        { date: '2024-01-04', visits: 10, newPatients: 2 },
        { date: '2024-01-05', visits: 18, newPatients: 5 }
      ]);
    } catch (error) {
      console.error('Error loading patient data:', error);
      setPatientData([]);
    }
  };

  const loadInventoryData = async () => {
    try {
      const response = await axios.get('/api/inventory/analytics/summary');
      setInventoryData(response.data);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setInventoryData({});
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const exportReport = () => {
    // This would implement actual export functionality
    alert('Export functionality would be implemented here');
  };

  const formatCurrency = (amount) => {
    return `Rs. ${(amount || 0).toLocaleString()}`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderRevenueReport = () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Revenue Analysis</h3>
        
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div className="card-content" style={{ textAlign: 'center' }}>
              <DollarSign size={32} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {formatCurrency(revenueData.reduce((sum, item) => sum + (item.total_revenue || 0), 0))}
              </div>
              <div style={{ color: '#6b7280' }}>Total Revenue</div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content" style={{ textAlign: 'center' }}>
              <Heart size={32} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {formatCurrency(revenueData.reduce((sum, item) => sum + (item.charity_revenue || 0), 0))}
              </div>
              <div style={{ color: '#6b7280' }}>Charity Revenue</div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content" style={{ textAlign: 'center' }}>
              <TrendingUp size={32} style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {revenueData.reduce((sum, item) => sum + (item.total_transactions || 0), 0)}
              </div>
              <div style={{ color: '#6b7280' }}>Total Transactions</div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Daily Revenue Trend</h4>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="regular_revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Regular Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="charity_revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Charity Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpenseReport = () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Expense Tracking</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Expense by Category - Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Expenses by Category</h4>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total_amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Distribution - Pie Chart */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Expense Distribution</h4>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total_amount"
                    label={({category, percent}) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expense Summary Table */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header">
            <h4 className="card-title">Expense Summary</h4>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total Amount</th>
                    <th>Transaction Count</th>
                    <th>Average Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseData.map((expense, index) => (
                    <tr key={index}>
                      <td style={{ textTransform: 'capitalize' }}>{expense.category}</td>
                      <td>{formatCurrency(expense.total_amount)}</td>
                      <td>{expense.count}</td>
                      <td>{formatCurrency(expense.avg_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatientReport = () => (
    <div>
      <h3 style={{ marginBottom: '2rem' }}>Patient Insights</h3>
      
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Patient Visit Trends</h4>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={patientData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Visits"
              />
              <Line 
                type="monotone" 
                dataKey="newPatients" 
                stroke="#10b981" 
                strokeWidth={2}
                name="New Patients"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div>
      <h3 style={{ marginBottom: '2rem' }}>Inventory Health</h3>
      
      {/* Inventory Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <Package size={32} style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {inventoryData.totalItems?.count || 0}
            </div>
            <div style={{ color: '#6b7280' }}>Total Items</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <DollarSign size={32} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {formatCurrency(inventoryData.totalValue?.value || 0)}
            </div>
            <div style={{ color: '#6b7280' }}>Total Inventory Value</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <TrendingUp size={32} style={{ color: inventoryData.lowStockCount?.count > 0 ? '#ef4444' : '#10b981', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: inventoryData.lowStockCount?.count > 0 ? '#ef4444' : '#10b981' }}>
              {inventoryData.lowStockCount?.count || 0}
            </div>
            <div style={{ color: '#6b7280' }}>Low Stock Items</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {inventoryData.categoryBreakdown && inventoryData.categoryBreakdown.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Inventory by Category</h4>
          </div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryData.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Item Count" />
                </BarChart>
              </ResponsiveContainer>
              
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={inventoryData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({category, percent}) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {inventoryData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="loading" style={{ minHeight: '400px' }}>
          <div className="spinner"></div>
        </div>
      );
    }

    switch (activeReport) {
      case 'revenue':
        return renderRevenueReport();
      case 'expenses':
        return renderExpenseReport();
      case 'patients':
        return renderPatientReport();
      case 'inventory':
        return renderInventoryReport();
      default:
        return <div>Report not found</div>;
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="dashboard-title">Visual Reports & Analytics</h1>
            <p className="dashboard-subtitle">Interactive charts and comprehensive business insights</p>
          </div>
          <button onClick={exportReport} className="btn btn-secondary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="tab-list" style={{ display: 'flex', background: '#f9fafb', borderRadius: '0.5rem', padding: '0.25rem' }}>
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button 
                key={report.id}
                className={`tab ${activeReport === report.id ? 'active' : ''}`}
                onClick={() => setActiveReport(report.id)}
                style={{ 
                  padding: '0.75rem 1rem', 
                  margin: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                <Icon size={16} />
                {report.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        padding: '1rem',
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <Filter size={20} color="#6b7280" />
        <span style={{ fontWeight: '500' }}>Date Range:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => handleDateRangeChange('from', e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => handleDateRangeChange('to', e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default ReportsTab;