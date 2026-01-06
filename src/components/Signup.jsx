import React, { useState, useEffect } from 'react';

const Signup = ({ onSignup }) => {
  const [availableUnits, setAvailableUnits] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', battalion: '', platoon: '', className: '', isAdmin: false
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/units')
      .then(res => res.json())
      .then(data => setAvailableUnits(data))
      .catch(err => console.error("Could not fetch units", err));
  }, []);

  // NEW: Added this function so the form has something to call
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onSignup(formData);
      }
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  const uniqueBattalions = [...new Set(availableUnits.map(u => u.battalion))];
  const filteredPlatoons = availableUnits.filter(u => u.battalion === formData.battalion);
  const filteredClasses = filteredPlatoons.filter(u => u.platoon === formData.platoon);

  return (
    <div className="auth-card">
      <h2>Student Registration</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full Name" onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
        
        <select onChange={(e) => setFormData({...formData, battalion: e.target.value, platoon: '', className: ''})} required>
          <option value="">Select Battalion</option>
          {uniqueBattalions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select disabled={!formData.battalion} onChange={(e) => setFormData({...formData, platoon: e.target.value, className: ''})} required>
          <option value="">Select Platoon</option>
          {[...new Set(filteredPlatoons.map(p => p.platoon))].map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select disabled={!formData.platoon} onChange={(e) => setFormData({...formData, className: e.target.value})} required>
          <option value="">Select Class</option>
          {filteredClasses.map(c => <option key={c.className} value={c.className}>{c.className}</option>)}
        </select>
        
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;