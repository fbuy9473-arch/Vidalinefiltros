import React from 'react';
import { LoginExperience } from './login/LoginExperience';

export const LoginView: React.FC<{ initialError?: string | null }> = ({ initialError = null }) => (
  <LoginExperience initialError={initialError} />
);
