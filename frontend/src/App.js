import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { FontSizeProvider, useFontSize } from './contexts/FontSizeContext';
import { ContrastProvider, useContrast } from './contexts/ContrastContext';

import HomePage from './pages/HomePage';
import EventsListPage from './pages/EventsListPage';
import EventDetailPage from './pages/EventDetailPage';
import EventFormPage from './pages/EventFormPage';
import ReservationsPage from './pages/ReservationsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// AppWrapper: pobiera fontSize i isHighContrast z kontekstów
function AppWrapper() {
  const { fontSize } = useFontSize();
  const { isHighContrast } = useContrast();

  return (
    <div
      className={isHighContrast ? 'high-contrast' : ''}
      style={{ fontSize: `${fontSize}%` }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/new" element={<EventFormPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<EventFormPage />} />

        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ContrastProvider>
        <FontSizeProvider>
          <AppWrapper />
        </FontSizeProvider>
      </ContrastProvider>
    </BrowserRouter>
  );
}
