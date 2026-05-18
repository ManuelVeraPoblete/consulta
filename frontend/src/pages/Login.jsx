import React from 'react';
import LoginLeft from '../components/login/LoginLeft';
import LoginForm from '../components/login/LoginForm';
import styles from './Login.module.css';

const Login = () => (
  <div className={styles.page}>
    <LoginLeft />
    <div className={styles.right}>
      <LoginForm />
    </div>
  </div>
);

export default Login;
