import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ResultsPage from './components/resultspage'
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import KPIDashboard from './components/KPIDashboard';
import { FileProvider, useFiles } from './context/FileContext';
import axios from 'axios';
import ComparativeAnalysis from './components/ComparativeAnalysis';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InterviewTest from './components/InterviewTest';
import Sidebar from './components/Sidebar';
import DetailedReport from './components/DetailedReport';
import HeaderBar from './components/HeaderBar';
import HPIDashboard from './components/HPIDashboard';
import React from 'react';





function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function AppLayout({ children }) {
  const { token } = useAuth();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeaderBar />
      <div style={{ display: 'flex', flex: 1, marginTop: 56 }}>
        {token && <Sidebar />}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0)

  return (
  
    // <TranscriptProvider>
   <AuthProvider>
    <FileProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Change default dashboard route to HPI Dashboard */}
            <Route path="/dashboard" element={<Navigate to="/dashboard/hpi" replace />} />

            <Route path="/dashboard/kpi" element={
              <ProtectedRoute>
                <KPIDashboard />
              </ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            } />
            <Route path="/results/:fileName" element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            } />
            <Route path="/comparative-analysis" element={
              <ProtectedRoute>
                <ComparativeAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/interview-test" element={
              <ProtectedRoute>
                <InterviewTest />
              </ProtectedRoute>
            } />
            <Route path="/detailed-report" element={
              <ProtectedRoute>
                <DetailedReport />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/hpi" element={
              <ProtectedRoute>
                <HPIDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </AppLayout>
      </Router>
      <ToastContainer />
    </FileProvider>
   </AuthProvider>
      // </TranscriptProvider>
  );
}

export default App
