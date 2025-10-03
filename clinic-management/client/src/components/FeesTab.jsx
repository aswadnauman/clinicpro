import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Check, 
  X, 
  Heart, 
  Filter,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';
import axios from 'axios';

const FeesTab = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadFees();
  }, [activeView]);

  const loadFees = async () => {
    try {
      setLoading(true);
      let url = '/api/fees';
      
      const params = new URLSearchParams();
      if (activeView === 'pending') params.append('status', 'pending');
      if (activeView === 'charity') params.append('charity_only', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setFees(response.data);
    } catch (error) {
      console.error('Error loading fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveCharityCase = async (feeId, approved) => {
    try {
      await axios.put(`/api/fees/${feeId}/approve-charity`, { approved });
      loadFees();
      alert(`Charity case ${approved ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error updating charity approval:', error);
      alert('Error updating charity approval');
    }
  };

  const collectPayment = async () => {
    if (!selectedFee || !paymentAmount) return;

    try {
      await axios.put(`/api/fees/${selectedFee.id}/collect-payment`, {
        paid_amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes
      });

      setShowPaymentModal(false);
      setSelectedFee(null);
      setPaymentAmount('');
      setPaymentNotes('');
      loadFees();
      alert('Payment collected successfully!');
    } catch (error) {
      console.error('Error collecting payment:', error);
      alert('Error collecting payment: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const openPaymentModal = (fee) => {
    setSelectedFee(fee);
    setPaymentAmount((fee.final_amount - (fee.paid_amount || 0)).toString());
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount) => {
    return `Rs. ${(amount || 0).toLocaleString()}`;
  };

  const getStatusBadge = (fee) => {
    let className = 'status-badge ';
    let text = '';

    switch (fee.payment_status) {
      case 'paid':
        className += 'status-success';
        text = 'Paid';
        break;
      case 'partial':
        className += 'status-warning';
        text = 'Partial';
        break;
      case 'pending':
        className += 'status-pending';
        text = 'Pending';
        break;
      default:
        className += 'status-pending';
        text = 'Unknown';
    }

    return <span className={className}>{text}</span>;
  };

  const filteredFees = fees.filter(fee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fee.patient_name?.toLowerCase().includes(searchLower) ||
      fee.patient_id?.toLowerCase().includes(searchLower) ||
      fee.doctor_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="dashboard-title">Fee & Payment Management</h1>
            <p className="dashboard-subtitle">Track payments, manage charity cases, and collect fees</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="tab-list" style={{ display: 'inline-flex', background: '#f9fafb', borderRadius: '0.5rem', padding: '0.25rem' }}>
          <button 
            className={`tab ${activeView === 'all' ? 'active' : ''}`}
            onClick={() => setActiveView('all')}
            style={{ padding: '0.5rem 1rem', margin: 0 }}
          >
            All Fees
          </button>
          <button 
            className={`tab ${activeView === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveView('pending')}
            style={{ padding: '0.5rem 1rem', margin: 0 }}
          >
            Pending Payments
          </button>
          <button 
            className={`tab ${activeView === 'charity' ? 'active' : ''}`}
            onClick={() => setActiveView('charity')}
            style={{ padding: '0.5rem 1rem', margin: 0 }}
          >
            <Heart size={16} />
            Charity Cases
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={20} style={{ 
            position: 'absolute', 
            left: '0.75rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#6b7280' 
          }} />
          <input
            type="text"
            placeholder="Search by patient name, ID, or doctor..."
            className="form-input"
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedFee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Collect Payment</h2>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div><strong>Patient:</strong> {selectedFee.patient_name} ({selectedFee.patient_id})</div>
              <div><strong>Doctor:</strong> {selectedFee.doctor_name}</div>
              <div><strong>Total Amount:</strong> {formatCurrency(selectedFee.final_amount)}</div>
              <div><strong>Already Paid:</strong> {formatCurrency(selectedFee.paid_amount || 0)}</div>
              <div><strong>Outstanding:</strong> {formatCurrency(selectedFee.final_amount - (selectedFee.paid_amount || 0))}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="form-input"
                placeholder="Enter amount to collect"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-select"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={collectPayment}
                className="btn btn-primary"
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                <DollarSign size={16} />
                Collect Payment
              </button>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fees Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Amount Details</th>
              <th>Payment Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td>
              </tr>
            ) : filteredFees.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {searchTerm ? 'No fees found matching your search.' : 'No fees recorded yet.'}
                </td>
              </tr>
            ) : (
              filteredFees.map((fee) => (
                <tr key={fee.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '500' }}>{fee.patient_name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {fee.patient_id}
                      </div>
                    </div>
                  </td>
                  <td>{fee.doctor_name}</td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div>
                        <strong>Base:</strong> {formatCurrency(fee.base_amount)}
                      </div>
                      {fee.is_charity_case && (
                        <div style={{ color: '#10b981' }}>
                          <Heart size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          Charity: -{fee.charity_discount_percent}% ({formatCurrency(fee.charity_discount_amount)})
                        </div>
                      )}
                      <div style={{ fontWeight: '600' }}>
                        <strong>Final:</strong> {formatCurrency(fee.final_amount)}
                      </div>
                      {fee.paid_amount > 0 && (
                        <div style={{ color: '#6b7280' }}>
                          Paid: {formatCurrency(fee.paid_amount)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {getStatusBadge(fee)}
                      {fee.is_charity_case && (
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          color: fee.charity_approved_by ? '#10b981' : '#f59e0b'
                        }}>
                          <Heart size={12} />
                          {fee.charity_approved_by ? 'Approved' : 'Pending Approval'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {new Date(fee.created_at).toLocaleDateString()}
                    {fee.payment_date && (
                      <div>
                        Paid: {new Date(fee.payment_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Payment Collection */}
                      {fee.payment_status !== 'paid' && (
                        <>
                          {fee.is_charity_case && !fee.charity_approved_by ? (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                onClick={() => approveCharityCase(fee.id, true)}
                                className="btn btn-success btn-sm"
                                title="Approve charity case"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => approveCharityCase(fee.id, false)}
                                className="btn btn-danger btn-sm"
                                title="Reject charity case"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openPaymentModal(fee)}
                              className="btn btn-primary btn-sm"
                              title="Collect payment"
                            >
                              <CreditCard size={12} />
                              {fee.payment_status === 'partial' ? 'Collect' : 'Pay'}
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Payment Method Badge */}
                      {fee.payment_method && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#e5e7eb',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          textTransform: 'capitalize'
                        }}>
                          {fee.payment_method}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-success {
          background: #d1fae5;
          color: #065f46;
        }
        .status-warning {
          background: #fef3c7;
          color: #92400e;
        }
        .status-pending {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
};

export default FeesTab;