import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';

const Protected = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        theme="dark"
        toastStyle={{
          backgroundColor : '#0a0e1a',
          border          : '1px solid rgba(0,212,255,0.2)',
          color           : '#ffffff'
        }}
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <Protected><Dashboard /></Protected>
        } />
      </Routes>
    </BrowserRouter>
  );
}