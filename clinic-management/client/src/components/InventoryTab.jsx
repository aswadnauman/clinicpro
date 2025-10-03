import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Edit,
  Minus,
  BarChart3,
  Calendar
} from 'lucide-react';
import axios from 'axios';

const InventoryTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category: 'medicines',
    brand: '',
    unit: 'pieces',
    current_stock: '',
    minimum_stock: '10',
    unit_cost: '',
    selling_price: '',
    supplier: '',
    expiry_date: '',
    batch_number: '',
    location: ''
  });

  useEffect(() => {
    loadItems();
  }, [activeView]);

  const loadItems = async () => {
    try {
      setLoading(true);
      let url = '/api/inventory';
      
      const params = new URLSearchParams();
      if (activeView === 'low_stock') params.append('low_stock_only', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setItems(response.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/inventory', formData);
      setShowAddForm(false);
      resetForm();
      loadItems();
      alert('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const adjustStock = async () => {
    if (!selectedItem || !adjustmentQuantity) return;

    try {
      await axios.post(`/api/inventory/${selectedItem.id}/adjust-stock`, {
        adjustment_type: adjustmentType,
        quantity: parseInt(adjustmentQuantity),
        notes: adjustmentNotes
      });

      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustmentQuantity('');
      setAdjustmentNotes('');
      loadItems();
      alert('Stock adjusted successfully!');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      item_code: '',
      item_name: '',
      category: 'medicines',
      brand: '',
      unit: 'pieces',
      current_stock: '',
      minimum_stock: '10',
      unit_cost: '',
      selling_price: '',
      supplier: '',
      expiry_date: '',
      batch_number: '',
      location: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAdjustModal = (item) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  const getStockStatusBadge = (item) => {
    let className = 'stock-badge ';
    let text = '';

    if (item.current_stock <= item.minimum_stock) {
      className += 'stock-critical';
      text = 'Low Stock';
    } else if (item.current_stock <= item.minimum_stock * 1.5) {
      className += 'stock-warning';
      text = 'Medium';
    } else {
      className += 'stock-good';
      text = 'Good';
    }

    return <span className={className}>{text}</span>;
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.item_code?.toLowerCase().includes(searchLower) ||
      item.brand?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="dashboard-title">Inventory Management</h1>
            <p className="dashboard-subtitle">Track medical supplies and manage stock levels</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={16} />
            Add New Item
          </button>
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
            All Items
          </button>
          <button 
            className={`tab ${activeView === 'low_stock' ? 'active' : ''}`}
            onClick={() => setActiveView('low_stock')}
            style={{ padding: '0.5rem 1rem', margin: 0 }}
          >
            <AlertTriangle size={16} />
            Low Stock
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
            placeholder="Search by name, code, brand, or category..."
            className="form-input"
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
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
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '2rem' }}>Add New Inventory Item</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Item Code</label>
                  <input
                    type="text"
                    name="item_code"
                    value={formData.item_code}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="e.g., MED001"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="e.g., Paracetamol 500mg"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="medicines">Medicines</option>
                    <option value="consumables">Consumables</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., PharmaCorp"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="pieces">Pieces</option>
                    <option value="strips">Strips</option>
                    <option value="boxes">Boxes</option>
                    <option value="bottles">Bottles</option>
                    <option value="rolls">Rolls</option>
                    <option value="pairs">Pairs</option>
                    <option value="ml">ML</option>
                    <option value="grams">Grams</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input
                    type="number"
                    name="current_stock"
                    value={formData.current_stock}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum Stock</label>
                  <input
                    type="number"
                    name="minimum_stock"
                    value={formData.minimum_stock}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Cost (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="unit_cost"
                    value={formData.unit_cost}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Supplier name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Number</label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Batch/Lot number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Medicine Cabinet A, Shelf 2"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  Add Item
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {setShowAddForm(false); resetForm();}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedItem && (
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
            <h2 style={{ marginBottom: '1.5rem' }}>Adjust Stock</h2>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div><strong>Item:</strong> {selectedItem.item_name}</div>
              <div><strong>Current Stock:</strong> {selectedItem.current_stock} {selectedItem.unit}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Adjustment Type</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                className="form-select"
              >
                <option value="increase">Increase Stock</option>
                <option value="decrease">Decrease Stock</option>
                <option value="set">Set Exact Amount</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
              </label>
              <input
                type="number"
                min="0"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                className="form-input"
                placeholder={adjustmentType === 'set' ? 'Enter new stock level' : 'Enter quantity to adjust'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="Reason for adjustment..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={adjustStock}
                className="btn btn-primary"
                disabled={!adjustmentQuantity || parseInt(adjustmentQuantity) < 0}
              >
                Adjust Stock
              </button>
              <button 
                onClick={() => setShowAdjustModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Item Details</th>
              <th>Stock Levels</th>
              <th>Pricing</th>
              <th>Expiry</th>
              <th>Status</th>
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
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {searchTerm ? 'No items found matching your search.' : 'No inventory items yet. Add your first item!'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '500' }}>{item.item_name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {item.item_code} • {item.brand}
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        background: '#e5e7eb', 
                        borderRadius: '0.25rem',
                        textTransform: 'capitalize'
                      }}>
                        {item.category}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {item.current_stock} {item.unit}
                      </div>
                      <div style={{ color: '#6b7280' }}>
                        Min: {item.minimum_stock} {item.unit}
                      </div>
                      {item.location && (
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          📍 {item.location}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      {item.unit_cost && (
                        <div>Cost: Rs. {parseFloat(item.unit_cost).toLocaleString()}</div>
                      )}
                      {item.selling_price && (
                        <div>Price: Rs. {parseFloat(item.selling_price).toLocaleString()}</div>
                      )}
                      {item.unit_cost && item.selling_price && (
                        <div style={{ color: '#10b981', fontSize: '0.75rem' }}>
                          Margin: {Math.round(((item.selling_price - item.unit_cost) / item.unit_cost) * 100)}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {item.expiry_date ? (
                      <div style={{ fontSize: '0.875rem' }}>
                        <div>{new Date(item.expiry_date).toLocaleDateString()}</div>
                        {isExpiringSoon(item.expiry_date) && (
                          <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            Expiring Soon
                          </div>
                        )}
                        {item.batch_number && (
                          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            Batch: {item.batch_number}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#6b7280' }}>No expiry</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {getStockStatusBadge(item)}
                      {isExpiringSoon(item.expiry_date) && (
                        <span style={{ 
                          padding: '0.25rem 0.5rem',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          Expiring
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openAdjustModal(item)}
                        className="btn btn-ghost btn-sm"
                        title="Adjust stock"
                      >
                        <Edit size={14} />
                      </button>
                      {item.current_stock <= item.minimum_stock && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#fee2e2',
                          color: '#991b1b',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          Reorder
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
        .stock-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .stock-good {
          background: #d1fae5;
          color: #065f46;
        }
        .stock-warning {
          background: #fef3c7;
          color: #92400e;
        }
        .stock-critical {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </div>
  );
};

export default InventoryTab;