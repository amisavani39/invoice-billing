import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import './Auth.css';

const Login = () => {
  return (
    <div className="auth-container">
      <SignIn routing="path" path="/login" signUpUrl="/register" />
    </div>
  );
};

export default Login;
