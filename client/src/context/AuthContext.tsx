import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  memberships: any[];
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, orgName?: string, phoneNumber?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<boolean>;
  updateUser: (updated: Partial<User>) => void;
  updateOrganization: (updated: Partial<Organization>) => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('qubix_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        setOrganization(res.data.data.organization);
        setMemberships(res.data.data.memberships || []);
        if (res.data.data.organization) {
          localStorage.setItem('qubix_active_org_id', res.data.data.organization.id);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Load user error:', err);
      setUser(null);
      setOrganization(null);
      localStorage.removeItem('qubix_access_token');
      localStorage.removeItem('qubix_active_org_id');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('qubix_access_token');
    if (savedToken) {
      reloadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password: pass });
      if (res.data.success) {
        const { user, organization, accessToken, memberships } = res.data.data;
        setUser(user);
        setOrganization(organization);
        setMemberships(memberships || []);
        setToken(accessToken);
        localStorage.setItem('qubix_access_token', accessToken);
        if (organization) {
          localStorage.setItem('qubix_active_org_id', organization.id);
        }
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: msg };
    }
  };

  const register = async (name: string, email: string, pass: string, orgName?: string, phoneNumber?: string) => {
    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        password: pass,
        organizationName: orgName,
        phoneNumber,
      });
      if (res.data.success) {
        const { user, organization, accessToken } = res.data.data;
        setUser(user);
        setOrganization(organization);
        setToken(accessToken);
        localStorage.setItem('qubix_access_token', accessToken);
        if (organization) {
          localStorage.setItem('qubix_active_org_id', organization.id);
        }
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Registration failed.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      setOrganization(null);
      setToken(null);
      localStorage.removeItem('qubix_access_token');
      localStorage.removeItem('qubix_active_org_id');
      window.location.href = '/login';
    }
  };

  const switchOrganization = async (orgId: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/switch-org', { organizationId: orgId });
      if (res.data.success) {
        const { accessToken, organization, role } = res.data.data;
        setToken(accessToken);
        localStorage.setItem('qubix_access_token', accessToken);
        localStorage.setItem('qubix_active_org_id', orgId);
        setOrganization({
          id: organization._id || organization.id,
          name: organization.name,
          slug: organization.slug,
          logoUrl: organization.logoUrl,
          status: organization.status,
          subscriptionPlan: organization.subscriptionPlan,
          subscriptionStatus: organization.subscriptionStatus,
          role,
        });
        window.location.reload();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AuthContext] Switch org failed:', err);
      return false;
    }
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const updateOrganization = (updated: Partial<Organization>) => {
    if (organization) {
      setOrganization({ ...organization, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        memberships,
        token,
        isLoading,
        login,
        register,
        logout,
        switchOrganization,
        updateUser,
        updateOrganization,
        reloadUser,
      }}
    >
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

