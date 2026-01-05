'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'user' | 'admin';

interface WorkflowTenantContextType {
  isAdmin: boolean;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  role: UserRole;
}

const WorkflowTenantContext = createContext<WorkflowTenantContextType | undefined>(undefined);

export function useWorkflowTenant() {
  const context = useContext(WorkflowTenantContext);
  if (context === undefined) {
    throw new Error('useWorkflowTenant must be used within a WorkflowTenantProvider');
  }
  return context;
}

interface WorkflowTenantProviderProps {
  children: ReactNode;
}

export function WorkflowTenantProvider({ children }: WorkflowTenantProviderProps) {
  const [role, setRoleState] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing role in localStorage
    const savedRole = localStorage.getItem('workflow-user-role') as UserRole;
    if (savedRole && (savedRole === 'user' || savedRole === 'admin')) {
      setRoleState(savedRole);
    }
    setIsLoading(false);
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('workflow-user-role', newRole);
  };

  const value: WorkflowTenantContextType = {
    isAdmin: role === 'admin',
    isLoading,
    setRole,
    role,
  };

  return (
    <WorkflowTenantContext.Provider value={value}>
      {children}
    </WorkflowTenantContext.Provider>
  );
}
