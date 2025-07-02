import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiGet('/users/profile')
      .then(res => setProfile(res.data.user))
      .catch(err => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await apiPost('/users/profile', profile);
      setSuccess('Profile updated!');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">First Name</label>
          <input
            className="input"
            name="firstName"
            value={profile.firstName || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block font-medium">Last Name</label>
          <input
            className="input"
            name="lastName"
            value={profile.lastName || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input
            className="input"
            name="email"
            value={profile.email || ''}
            onChange={handleChange}
            type="email"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Save Changes
        </button>
        {success && <div className="text-green-600">{success}</div>}
        {error && <div className="text-red-500">{error}</div>}
      </form>
    </div>
  );
};

export default ProfilePage; 