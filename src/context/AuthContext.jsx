import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children, apiString }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userData: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isPremium: false,
    isProfileComplete: false,
  });
  const navigate = useNavigate();
  const location = useLocation();

  const publicRoutes = useMemo(() => [
    '/login',
    '/signup',
    '/forgot-password',
    '/forgot-password/:email/:token',
    '/about',
    '/news',
  ], []); // Empty dependency array since publicRoutes is static

  const isPublicRoute = useCallback(() => {
    return publicRoutes.some((route) =>
      route.includes(':')
        ? location.pathname.match(route.replace(/:email|:token/g, '[^/]+'))
        : location.pathname === route
    );
  }, [location.pathname, publicRoutes]);

  const checkProfileCompleteness = useCallback((userData) => {
    if (!userData) return false;
    const { about_me, dob } = userData;
    const isAboutMeFilled = about_me && about_me.trim() !== '';
    const isDobFilled = !!dob;
    return isAboutMeFilled && isDobFilled;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');
      const user = localStorage.getItem('user');

      console.log('Initial auth check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUser: !!user,
      });

      // Skip auth check for public routes
      if (isPublicRoute()) {
        console.log('Public route detected, skipping auth check:', location.pathname);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      if (!accessToken || !refreshToken || !user) {
        console.log('Missing tokens or user data, setting unauthenticated state');
        setAuthState({
          isLoggedIn: false,
          userData: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          isPremium: false,
          isProfileComplete: false,
        });
        navigate('/login');
        return;
      }

      const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000';
      console.log('Verifying token with /api/auth/profile/ using API URL:', apiUrl);

      try {
        const config = { headers: { Authorization: `Bearer ${accessToken}` } };
        const response = await axios.get(`${apiUrl}/api/auth/profile/`, config);
        console.log('Profile verification successful:', response.data);
        const isPremium = response.data.membership_level === 'Premium';
        const isProfileComplete = checkProfileCompleteness(response.data);
        setAuthState({
          isLoggedIn: true,
          userData: response.data,
          accessToken,
          refreshToken,
          isLoading: false,
          isPremium,
          isProfileComplete,
        });
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Profile verification failed:', error.response?.status, error.response?.data);
        if (error.response?.status === 401 && refreshToken) {
          try {
            console.log('Attempting token refresh');
            const refreshResponse = await axios.post(`${apiUrl}/api/auth/token/refresh/`, {
              refresh: refreshToken,
            });
            const newAccessToken = refreshResponse.data.access;
            console.log('Token refresh successful, new accessToken:', newAccessToken);

            Cookies.set('accessToken', newAccessToken, { expires: 1, path: '/' });

            const retryConfig = { headers: { Authorization: `Bearer ${newAccessToken}` } };
            const retryResponse = await axios.get(`${apiUrl}/api/auth/profile/`, retryConfig);
            console.log('Retry profile verification successful:', retryResponse.data);
            const isPremium = retryResponse.data.membership_level === 'Premium';
            const isProfileComplete = checkProfileCompleteness(retryResponse.data);
            setAuthState({
              isLoggedIn: true,
              userData: retryResponse.data,
              accessToken: newAccessToken,
              refreshToken,
              isLoading: false,
              isPremium,
              isProfileComplete,
            });
            localStorage.setItem('user', JSON.stringify(retryResponse.data));
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError.response?.status, refreshError.response?.data);
            console.log('Cleaning up due to failed refresh');
            handleCleanup();
            navigate('/login');
          }
        } else {
          console.error('Unexpected error during profile verification, cleaning up:', error);
          handleCleanup();
          navigate('/login');
        }
      }
    };

    initializeAuth();
  }, [navigate, apiString, location.pathname, isPublicRoute, checkProfileCompleteness]);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        // Skip adding Authorization header for public routes or specific auth endpoints
        if (
          config.url.includes('/api/auth/') &&
          !config.url.includes('/login/') &&
          !config.url.includes('/token/refresh/') &&
          !config.url.includes('/forget-password/') &&
          !config.url.includes('/verify-reset-code/') &&
          !config.url.includes('/reset-password/')
        ) {
          if (!authState.accessToken) {
            console.log('No access token for protected route, skipping Authorization header');
            return config;
          }
          config.headers.Authorization = `Bearer ${authState.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && authState.refreshToken) {
          originalRequest._retry = true;
          try {
            console.log('Interceptor: Attempting token refresh');
            const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000';
            const refreshResponse = await axios.post(
              `${apiUrl}/api/auth/token/refresh/`,
              { refresh: authState.refreshToken }
            );
            const newAccessToken = refreshResponse.data.access;
            console.log('Interceptor: Token refresh successful, new accessToken:', newAccessToken);

            Cookies.set('accessToken', newAccessToken, { expires: 1, path: '/' });
            setAuthState((prev) => ({ ...prev, accessToken: newAccessToken }));

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('Interceptor: Token refresh failed:', refreshError.response?.status, refreshError.response?.data);
            console.log('Interceptor: Cleaning up and redirecting to login');
            handleCleanup();
            navigate('/login');
            return Promise.reject(refreshError);
          }
        } else if (error.response?.status === 401) {
          console.log('Interceptor: 401 error, but no refresh token available, redirecting to login');
          handleCleanup();
          navigate('/login');
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [authState.accessToken, authState.refreshToken, navigate, apiString, isPublicRoute]);

  const handleCleanup = () => {
    console.log('Cleaning up authentication state');
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    localStorage.removeItem('user');
    setAuthState({
      isLoggedIn: false,
      userData: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isPremium: false,
      isProfileComplete: false,
    });
  };

  const login = (accessToken, refreshToken, user, rememberMe = false) => {
    const expires = rememberMe ? 7 : 1;
    console.log('Logging in with:', { accessToken, refreshToken, user, rememberMe });
    Cookies.set('accessToken', accessToken, { expires, path: '/' });
    Cookies.set('refreshToken', refreshToken, { expires, path: '/' });
    localStorage.setItem('user', JSON.stringify(user));

    const isPremium = user.membership_level === 'Premium';
    const isProfileComplete = checkProfileCompleteness(user);
    setAuthState({
      isLoggedIn: true,
      userData: user,
      accessToken,
      refreshToken,
      isLoading: false,
      isPremium,
      isProfileComplete,
    });
  };

  const logout = async () => {
    const { accessToken, refreshToken } = authState;
    console.log('Logging out with tokens:', { accessToken, refreshToken });

    if (refreshToken && accessToken) {
      try {
        const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000';
        console.log('Sending logout request to backend using API URL:', apiUrl);
        await axios.post(`${apiUrl}/api/auth/logout/`, {
          refresh_token: refreshToken,
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('Logout request successful');
      } catch (error) {
        console.error('Logout error:', error.response?.status, error.response?.data);
      }
    } else {
      console.log('No tokens available for logout request');
    }

    handleCleanup();
    navigate('/login');
  };

  const updateUserData = async () => {
    if (!authState.isLoggedIn || !authState.accessToken) {
      console.log('Cannot update user data: user not logged in or no access token');
      return;
    }

    const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000';
    try {
      console.log('Fetching updated user data from /api/auth/profile/');
      const config = { headers: { Authorization: `Bearer ${authState.accessToken}` } };
      const response = await axios.get(`${apiUrl}/api/auth/profile/`, config);
      console.log('Updated user data fetched:', response.data);
      const isPremium = response.data.membership_level === 'Premium';
      const isProfileComplete = checkProfileCompleteness(response.data);
      setAuthState((prev) => ({
        ...prev,
        userData: response.data,
        isPremium,
        isProfileComplete,
      }));
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to update user data:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        console.log('Access token expired during user data update, attempting refresh');
      } else {
        console.error('Unexpected error during user data update, cleaning up:', error);
        handleCleanup();
        navigate('/login');
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn: authState.isLoggedIn,
      userData: authState.userData,
      accessToken: authState.accessToken,
      refreshToken: authState.refreshToken,
      isLoading: authState.isLoading,
      isPremium: authState.isPremium,
      isProfileComplete: authState.isProfileComplete,
      login,
      logout,
      updateUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};