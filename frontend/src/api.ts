// Simple API utility for frontend

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://afterink-invoice.onrender.com/api'  // Your actual Render backend URL
  : '/api'; // Use Vite proxy for local/dev

function getAuthToken() {
  return localStorage.getItem('token');
}

async function refreshAccessToken() {
  const authData = JSON.parse(localStorage.getItem('afterink-auth') || '{}');
  const refreshToken = authData?.state?.tokens?.refreshToken;
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  if (data.success && data.data && data.data.tokens) {
    // Update localStorage with new tokens
    const currentAuth = JSON.parse(localStorage.getItem('afterink-auth') || '{}');
    currentAuth.state.tokens = data.data.tokens;
    localStorage.setItem('afterink-auth', JSON.stringify(currentAuth));
    localStorage.setItem('token', data.data.tokens.accessToken);
    return data.data.tokens.accessToken;
  }
  
  throw new Error('Invalid refresh response');
}

async function apiGet(path: string) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
    });
    
    if (res.status === 401) {
      // Token expired, try to refresh
      const newToken = await refreshAccessToken();
      // Retry with new token
      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        credentials: 'include',
      });
      if (!retryRes.ok) throw new Error(await retryRes.text());
      return retryRes.json();
    }
    
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error: any) {
    if (error.message.includes('refresh')) {
      // Refresh failed, user needs to log in again
      localStorage.removeItem('token');
      localStorage.removeItem('afterink-auth');
      window.location.href = '/auth/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  }
}

async function apiPost(path: string, data: any) {
  try {
    console.log(`Making POST request to: ${API_BASE_URL}${path}`);
    console.log('Request data:', data);
    
    const makeRequest = async (token: string) => {
      return fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
    };
    
    let res = await makeRequest(getAuthToken() || '');
    
    // If token expired, try to refresh and retry
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      res = await makeRequest(newToken);
    }
    
    console.log('Response status:', res.status);
    console.log('Response ok:', res.ok);
    
    const responseText = await res.text();
    console.log('Response text:', responseText);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${responseText}`);
    }
    
    try {
      const result = JSON.parse(responseText);
      
      // Handle both demo server format (direct object) and MongoDB server format ({ success: true, data: {...} })
      if (result.success && result.data) {
        console.log('Detected MongoDB server response format');
        return result.data;
      } else if (result._id) {
        console.log('Detected demo server response format');
        return result;
      } else {
        console.log('Using response as-is');
        return result;
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error: any) {
    console.error('API POST Error:', error);
    if (error.message.includes('refresh')) {
      localStorage.removeItem('token');
      localStorage.removeItem('afterink-auth');
      window.location.href = '/auth/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  }
}

async function apiPut(path: string, data: any) {
  try {
    const makeRequest = async (token: string) => {
      return fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
    };
    
    let res = await makeRequest(getAuthToken() || '');
    
    // If token expired, try to refresh and retry
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      res = await makeRequest(newToken);
    }
    
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error: any) {
    if (error.message.includes('refresh')) {
      localStorage.removeItem('token');
      localStorage.removeItem('afterink-auth');
      window.location.href = '/auth/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  }
}

async function apiDelete(path: string) {
  try {
    const makeRequest = async (token: string) => {
      return fetch(`${API_BASE_URL}${path}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
    };
    
    let res = await makeRequest(getAuthToken() || '');
    
    // If token expired, try to refresh and retry
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      res = await makeRequest(newToken);
    }
    
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error: any) {
    if (error.message.includes('refresh')) {
      localStorage.removeItem('token');
      localStorage.removeItem('afterink-auth');
      window.location.href = '/auth/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  }
}

export { apiGet, apiPost, apiPut, apiDelete, getAuthToken, API_BASE_URL }; 