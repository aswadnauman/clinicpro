import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Calendar, 
  Phone, 
  Mail,
  User,
  Heart,
  FileText,
  Upload
} from 'lucide-react';
import axios from 'axios';

const PatientsTab = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    medical_history: '',
    allergies: '',
    blood_group: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    // Generate patient ID when form is opened
    if (showAddForm && !formData.patient_id) {
      generatePatientId();
    }
  }, [showAddForm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/patients?search=${searchTerm}`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePatientId = async () => {
    // Generate next patient ID (P-001, P-002, etc.)
    const patientCount = patients.length + 1;
    const newId = `P-${String(patientCount).padStart(3, '0')}`;
    setFormData(prev => ({ ...prev, patient_id: newId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/patients', formData);
      setShowAddForm(false);
      setFormData({
        patient_id: '',
        name: '',
        age: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        emergency_contact: '',
        medical_history: '',
        allergies: '',
        blood_group: ''
      });
      loadPatients();
      alert('Patient added successfully!');
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Error adding patient: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const viewPatientDetails = async (patientId) => {
    try {
      const response = await axios.get(`/api/patients/${patientId}`);
      setSelectedPatient(response.data);
      setShowPatientDetails(true);
    } catch (error) {
      console.error('Error loading patient details:', error);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.phone && patient.phone.includes(searchTerm))
  );

  if (showPatientDetails && selectedPatient) {
    return <PatientDetailsView patient={selectedPatient} onBack={() => setShowPatientDetails(false)} />;
  }

  return (
    <div>
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="dashboard-title">Patient Management</h1>
            <p className="dashboard-subtitle">Manage patient records and medical history</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={16} />
            Add New Patient
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
            placeholder="Search patients by name, ID, or phone..."
            className="form-input"
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Add Patient Modal */}
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '2rem' }}>Add New Patient</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Patient ID</label>
                  <input
                    type="text"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input
                    type="tel"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allergies</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="2"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  Add Patient
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age/Gender</th>
              <th>Contact</th>
              <th>Blood Group</th>
              <th>Last Visit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {searchTerm ? 'No patients found matching your search.' : 'No patients yet. Add your first patient!'}
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                      {patient.patient_id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '500' }}>{patient.name}</div>
                      {patient.email && (
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {patient.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {patient.age && `${patient.age}y`}
                    {patient.age && patient.gender && ' • '}
                    {patient.gender && patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  </td>
                  <td>
                    {patient.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} />
                        {patient.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      background: '#f3f4f6', 
                      borderRadius: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      {patient.blood_group || 'N/A'}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280' }}>
                    {new Date(patient.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => viewPatientDetails(patient.id)}
                      >
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <Calendar size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Patient Details View Component
const PatientDetailsView = ({ patient, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [visits, setVisits] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'visits') {
      loadVisits();
    } else if (activeTab === 'records') {
      loadRecords();
    }
  }, [activeTab]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/patients/${patient.id}/visits`);
      setVisits(response.data);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/patients/${patient.id}/records`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back to Patients
        </button>
        <div>
          <h1 className="dashboard-title">{patient.name}</h1>
          <p className="dashboard-subtitle">Patient ID: {patient.patient_id}</p>
        </div>
      </div>

      <div className="tabs">
        <div className="tab-list">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <User size={16} />
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'visits' ? 'active' : ''}`}
            onClick={() => setActiveTab('visits')}
          >
            <Calendar size={16} />
            Visits
          </button>
          <button 
            className={`tab ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <FileText size={16} />
            Medical Records
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Personal Information</h3>
                </div>
                <div className="card-content">
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <strong>Name:</strong> {patient.name}
                    </div>
                    <div>
                      <strong>Age:</strong> {patient.age || 'N/A'}
                    </div>
                    <div>
                      <strong>Gender:</strong> {patient.gender || 'N/A'}
                    </div>
                    <div>
                      <strong>Blood Group:</strong> {patient.blood_group || 'N/A'}
                    </div>
                    <div>
                      <strong>Phone:</strong> {patient.phone || 'N/A'}
                    </div>
                    <div>
                      <strong>Email:</strong> {patient.email || 'N/A'}
                    </div>
                    <div>
                      <strong>Address:</strong> {patient.address || 'N/A'}
                    </div>
                    <div>
                      <strong>Emergency Contact:</strong> {patient.emergency_contact || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Medical Information</h3>
                </div>
                <div className="card-content">
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <strong>Medical History:</strong>
                      <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                        {patient.medical_history || 'No medical history recorded'}
                      </p>
                    </div>
                    <div>
                      <strong>Allergies:</strong>
                      <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                        {patient.allergies || 'No known allergies'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Visit History</h3>
                <button className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  Schedule Visit
                </button>
              </div>
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : visits.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  No visits recorded yet.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Doctor</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((visit) => (
                        <tr key={visit.id}>
                          <td>
                            {new Date(visit.visit_date).toLocaleDateString()}
                            <br />
                            <small style={{ color: '#6b7280' }}>{visit.visit_time}</small>
                          </td>
                          <td>{visit.doctor_name}</td>
                          <td>{visit.reason_for_visit || 'N/A'}</td>
                          <td>
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              background: visit.status === 'completed' ? '#d1fae5' : '#fef3c7', 
                              color: visit.status === 'completed' ? '#065f46' : '#92400e',
                              borderRadius: '1rem',
                              fontSize: '0.875rem'
                            }}>
                              {visit.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-sm">
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Medical Records</h3>
                <button className="btn btn-primary btn-sm">
                  <Upload size={14} />
                  Upload Record
                </button>
              </div>
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : records.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  No medical records uploaded yet.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Doctor</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td>{new Date(record.upload_date).toLocaleDateString()}</td>
                          <td>
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              background: '#f3f4f6', 
                              borderRadius: '1rem',
                              fontSize: '0.875rem',
                              textTransform: 'capitalize'
                            }}>
                              {record.record_type}
                            </span>
                          </td>
                          <td>{record.title}</td>
                          <td>{record.doctor_name}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-ghost btn-sm">
                                <Eye size={14} />
                              </button>
                              {record.file_path && (
                                <a 
                                  href={record.file_path} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost btn-sm"
                                >
                                  <FileText size={14} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientsTab;