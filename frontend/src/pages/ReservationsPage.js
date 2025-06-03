// src/pages/ReservationsPage.js
import React, { useEffect, useState, useContext } from 'react';
import { Container, Spinner, Alert, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import http from '../api/httpClient';
import NavBar from '../components/NavBar';
import { AuthContext } from '../contexts/AuthContext';

export default function ReservationsPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [reservations, setReservations] = useState([]);
  const [eventsMap, setEventsMap] = useState({}); // { [eventId]: { title, date } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Jeśli użytkownik nie jest jeszcze wczytany, czekamy
    if (authLoading) return;

    // Jeżeli brak użytkownika (niezalogowany), przerywamy
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // 1) Pobierz wszystkie rezerwacje użytkownika
        const resRes = await http.get('/reservations');
        const dataRes = resRes.data;
        if (!Array.isArray(dataRes)) {
          console.error('Expected an array from /reservations, got:', dataRes);
          setReservations([]);
        } else {
          setReservations(dataRes);
        }

        // 2) Pobierz wszystkie eventy (żeby mieć dostęp do tytułów)
        const resEvents = await http.get('/events');
        const dataEvents = resEvents.data;
        if (!Array.isArray(dataEvents)) {
          console.error('Expected an array from /events, got:', dataEvents);
          setEventsMap({});
        } else {
          // Zbuduj mapę: eventId -> { title, date }
          const map = {};
          dataEvents.forEach((e) => {
            map[e.id] = { title: e.title, date: e.date };
          });
          setEventsMap(map);
        }
      } catch (err) {
        console.error('Error fetching reservations or events:', err);
        setError(t('reservations.errorLoading'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, t]);

  if (authLoading || loading) {
    return (
      <>
        <NavBar />
        <Container className="mt-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <NavBar />
        <Container className="mt-5">
          <Alert variant="warning">{t('reservations.loginToView')}</Alert>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <Container className="mt-5">
          <Alert variant="danger">{error}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Container className="mt-4">
        <h2>{t('reservations.title')}</h2>

        {reservations.length === 0 ? (
          <Alert variant="info">{t('reservations.noReservations')}</Alert>
        ) : (
          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>{t('reservations.eventTitle')}</th>
                <th>{t('reservations.date')}</th>
                <th>{t('reservations.tickets')}</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const evt = eventsMap[r.event_id];
                const title = evt ? evt.title : t('reservations.unknownEvent');
                const dateText = evt?.date
                  ? new Date(evt.date).toLocaleDateString()
                  : '-';
                return (
                  <tr key={r.id}>
                    <td>{title}</td>
                    <td>{dateText}</td>
                    <td>{r.tickets}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Container>
    </>
  );
}
