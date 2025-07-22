import React, { useEffect, useState } from 'react';
import { User, Mail, MapPin, Save, Loader, DollarSign, Gift, Receipt, TrendingUp, Calendar, Building, Phone, Globe, CreditCard, Shield, Activity } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../api';
import { useAuthStore } from '../store/authStore';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

interface FinancialStats {
  totalIncome: number;
  totalBonuses: number;
  totalExpenses: number;
  netIncome: number;
  thisMonthIncome: number;
  thisMonthBonuses: number;
  thisMonthExpenses: number;
  thisMonthNet: number;
  totalInvoices: number;
  totalClients: number;
  totalProjects: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchFinancialStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet('/users/profile');
      console.log('Profile response:', res);
      
      // Handle different response structures
      let profileData;
      if (res && res.data && res.data.user) {
        profileData = res.data.user;
      } else if (res && res.user) {
        profileData = res.user;
      } else if (res && res._id) {
        profileData = res;
      } else {
        throw new Error('Invalid profile response structure');
      }
      
      setProfile(profileData);
      setAvatar(profileData.avatar || null);
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      if (err.message.includes('Access token') || err.message.includes('Failed to fetch') || err.message.includes('401')) {
        setError('🔒 Please log in to view your profile');
      } else {
        setError(err.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialStats = async () => {
    try {
      setStatsLoading(true);
      // Fetch financial data from various endpoints
      const [invoicesRes, bonusesRes, expensesRes, clientsRes, projectsRes] = await Promise.allSettled([
        apiGet('/invoices'),
        apiGet('/bonuses'),
        apiGet('/expenses'),
        apiGet('/clients'),
        apiGet('/projects')
      ]);

      // Calculate financial stats
      const invoices = invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data || invoicesRes.value || []) : [];
      const bonuses = bonusesRes.status === 'fulfilled' ? (bonusesRes.value.data || bonusesRes.value || []) : [];
      const expenses = expensesRes.status === 'fulfilled' ? (expensesRes.value.data || expensesRes.value || []) : [];
      const clients = clientsRes.status === 'fulfilled' ? (clientsRes.value.data || clientsRes.value || []) : [];
      const projects = projectsRes.status === 'fulfilled' ? (projectsRes.value.data || projectsRes.value || []) : [];

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const totalIncome = invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
      const totalBonuses = bonuses.reduce((sum: number, bonus: any) => sum + (bonus.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

      const thisMonthIncome = invoices.filter((inv: any) => {
        const date = new Date(inv.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

      const thisMonthBonuses = bonuses.filter((bonus: any) => {
        const date = new Date(bonus.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).reduce((sum: number, bonus: any) => sum + (bonus.amount || 0), 0);

      const thisMonthExpenses = expenses.filter((exp: any) => {
        const date = new Date(exp.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

      const pendingInvoices = invoices.filter((inv: any) => inv.status === 'pending').length;
      const overdueInvoices = invoices.filter((inv: any) => {
        const dueDate = new Date(inv.dueDate);
        return inv.status === 'pending' && dueDate < now;
      }).length;

      setFinancialStats({
        totalIncome,
        totalBonuses,
        totalExpenses,
        netIncome: totalIncome + totalBonuses - totalExpenses,
        thisMonthIncome,
        thisMonthBonuses,
        thisMonthExpenses,
        thisMonthNet: thisMonthIncome + thisMonthBonuses - thisMonthExpenses,
        totalInvoices: invoices.length,
        totalClients: clients.length,
        totalProjects: projects.length,
        pendingInvoices,
        overdueInvoices
      });
    } catch (err) {
      console.error('Error fetching financial stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
    // Clear success message when user starts editing
    if (success) setSuccess(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone || '',
        countryCode: profile.countryCode || '+91',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || '',
        avatar: avatar || '',
      };
      await apiPut('/users/profile', updateData);
      setSuccess('✅ Profile updated successfully!');
      if (authUser) {
        authUser.firstName = profile.firstName;
        authUser.lastName = profile.lastName;
        authUser.email = profile.email;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2 text-blue-400">
          <Loader className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && error.includes('🔒')) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <div className="text-yellow-400 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchProfile}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <div className="text-gray-400 text-4xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">No Profile Data</h2>
          <p className="text-gray-400">Unable to load profile information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2"><User className="inline-block text-blue-400" /> Profile</h1>
              <p className="text-gray-300 mt-2">Manage your personal information and view your financial overview.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {!statsLoading && financialStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-800 to-green-600 rounded-2xl p-6 border border-green-700 flex items-center gap-4 shadow-lg">
            <DollarSign className="text-white bg-green-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Total Income</div>
              <div className="text-2xl text-green-200 font-bold">₹{financialStats.totalIncome.toLocaleString()}</div>
              <div className="text-sm text-green-300">This month: ₹{financialStats.thisMonthIncome.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-800 to-purple-600 rounded-2xl p-6 border border-purple-700 flex items-center gap-4 shadow-lg">
            <Gift className="text-white bg-purple-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Total Bonuses</div>
              <div className="text-2xl text-purple-200 font-bold">₹{financialStats.totalBonuses.toLocaleString()}</div>
              <div className="text-sm text-purple-300">This month: ₹{financialStats.thisMonthBonuses.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-800 to-red-600 rounded-2xl p-6 border border-red-700 flex items-center gap-4 shadow-lg">
            <Receipt className="text-white bg-red-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Total Expenses</div>
              <div className="text-2xl text-red-200 font-bold">₹{financialStats.totalExpenses.toLocaleString()}</div>
              <div className="text-sm text-red-300">This month: ₹{financialStats.thisMonthExpenses.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-2xl p-6 border border-blue-700 flex items-center gap-4 shadow-lg">
            <TrendingUp className="text-white bg-blue-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Net Income</div>
              <div className="text-2xl text-blue-200 font-bold">₹{financialStats.netIncome.toLocaleString()}</div>
              <div className="text-sm text-blue-300">This month: ₹{financialStats.thisMonthNet.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Business Stats Cards */}
      {!statsLoading && financialStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-800 to-indigo-600 rounded-2xl p-6 border border-indigo-700 flex items-center gap-4 shadow-lg">
            <Building className="text-white bg-indigo-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Total Clients</div>
              <div className="text-2xl text-indigo-200 font-bold">{financialStats.totalClients}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-800 to-orange-600 rounded-2xl p-6 border border-orange-700 flex items-center gap-4 shadow-lg">
            <Activity className="text-white bg-orange-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Total Projects</div>
              <div className="text-2xl text-orange-200 font-bold">{financialStats.totalProjects}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-800 to-yellow-600 rounded-2xl p-6 border border-yellow-700 flex items-center gap-4 shadow-lg">
            <Calendar className="text-white bg-yellow-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Total Invoices</div>
              <div className="text-2xl text-yellow-200 font-bold">{financialStats.totalInvoices}</div>
              <div className="text-sm text-yellow-300">{financialStats.pendingInvoices} pending</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-800 to-red-600 rounded-2xl p-6 border border-red-700 flex items-center gap-4 shadow-lg">
            <Shield className="text-white bg-red-500 rounded-full p-2" size={40} />
            <div>
              <div className="text-white text-lg font-bold">Overdue Invoices</div>
              <div className="text-2xl text-red-200 font-bold">{financialStats.overdueInvoices}</div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div className="p-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={avatar || '/default-avatar.png'}
                alt="Avatar"
                className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover shadow-lg"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <span className="text-xs font-bold">Edit</span>
              </label>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{profile.firstName} {profile.lastName}</h2>
              <p className="text-gray-400 flex items-center gap-1 justify-center">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
              <p className="text-gray-400 text-sm capitalize">{profile.role}</p>
              <p className="text-gray-500 text-xs">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Profile Form */}
          <form className="flex-1 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={profile.address || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={profile.city || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={profile.state || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Zip Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={profile.zipCode || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter zip code"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-1 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={profile.country || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter country"
                />
              </div>
              <div></div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
            
            {success && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400">
                {success}
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 