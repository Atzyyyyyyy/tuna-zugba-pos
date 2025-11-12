import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

// Must be outside component
Modal.setAppElement('#root');

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    agreedTerms: false,
  });

  const [policies, setPolicies] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Fetch all policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/policies');
        console.log('✅ Policies fetched:', res.data);
        setPolicies(res.data);
      } catch (err) {
        console.error('❌ Error fetching policies:', err);
      }
    };
    fetchPolicies();
  }, []);

  // Modal controls
  const openModal = (policy) => {
    console.log('🟢 Opening modal for:', policy);
    setSelectedPolicy(policy);
    setModalIsOpen(true);
  };

  const closeModal = () => setModalIsOpen(false);

  // Handle form fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agreedTerms) {
      alert('⚠️ Please agree to the policies before registering.');
      return;
    }

    console.log('🟡 Submitting registration:', formData);

    try {
      const res = await axios.post('http://localhost:8000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.passwordConfirm,
        agreed_terms: formData.agreedTerms,
      });

      console.log('✅ Registration response:', res.data);
      alert('✅ Registered! Check your email and SMS for verification.');

      // reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        passwordConfirm: '',
        agreedTerms: false,
      });
    } catch (err) {
      console.error('❌ Registration error:', err);
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : 'Registration failed.');
      alert('❌ Error: ' + message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-primary mb-4">Register</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
        <input
          type="password"
          name="passwordConfirm"
          placeholder="Confirm Password"
          value={formData.passwordConfirm}
          onChange={handleChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />

        {/* Policies */}
        <div className="text-sm mt-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="agreedTerms"
              checked={formData.agreedTerms}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span>I agree to the:</span>
          </label>

          <div className="flex flex-wrap gap-3 mt-2">
            {policies.length === 0 && (
              <p className="text-gray-500 italic">Loading policies...</p>
            )}
            {policies.map((policy) => (
              <button
                key={policy.id}
                type="button"
                onClick={() => openModal(policy)}
                className="text-accent underline hover:text-primary"
              >
                {policy.title || policy.type}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition"
        >
          Register
        </button>
      </form>

      {/* Policy Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="p-6 bg-white dark:bg-gray-800 rounded-lg max-w-lg mx-auto mt-20 shadow-xl overflow-y-auto max-h-[80vh]"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-[9999]"
      >
        <h3 className="text-xl font-bold text-primary mb-3">
          {selectedPolicy?.title}
        </h3>
        <div className="text-gray-700 dark:text-gray-100 whitespace-pre-line">
          {selectedPolicy?.content}
        </div>
        <button
          onClick={closeModal}
          className="mt-6 px-4 py-2 bg-accent text-white rounded-lg w-full hover:bg-primary transition"
        >
          Close
        </button>
      </Modal>
    </div>
  );
}

export default Register;
