// src/pages/EventsListPage.js
import React, { useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import http from '../api/httpClient';
import NavBar from '../components/NavBar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import './EventsListPage.css';
import Calendar from 'react-calendar';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';

export default function EventsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [events, setEvents] = useState([]);       // oryginalna tablica eventów
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventDates, setEventDates] = useState([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await http.get('/events');
        const data = response.data;
        if (!Array.isArray(data)) {
          console.error('Expected an array from /events, got:', data);
          setEvents([]);
          setEventDates([]);
        } else {
          // 1) Sortowanie chronologiczne po polu "date" (rosnąco)
          const sorted = data.slice().sort((a, b) => {
            const da = new Date(a.date);
            const db = new Date(b.date);
            return da - db;
          });
          setEvents(sorted);

          // 2) Wyciągamy daty i konwertujemy do numeru dnia (timestamp bez czasu)
          const dates = sorted
            .map((e) => {
              if (!e.date) return null;
              const d = new Date(e.date);
              if (isNaN(d)) return null;
              // Ustawiamy godziny na 0:00, aby porównywać tylko dzień
              return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            })
            .filter((d) => d !== null);
          setEventDates(dates);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(t('eventsList.noEvents'));
        setEventDates([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [t]);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      return eventDates.includes(dateTimestamp) ? 'event-date' : null;
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <Container className="mt-5 text-center">
          <Spinner animation="border" />
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
        {/* Przycisk tworzenia eventu (tylko dla organizatora) */}
        {user && user.role === 'organizer' && (
          <div className="mb-3 text-end">
            <Button variant="success" onClick={() => navigate('/events/new')}>
              {t('eventsList.createEvent')}
            </Button>
          </div>
        )}

        {/* KALENDARZ - wyświetlany nad listą eventów */}
        <Row className="justify-content-center mb-4">
          <Col md={6} className="d-flex justify-content-center">
            <Calendar tileClassName={tileClassName} />
          </Col>
        </Row>

        {/* Tytuł strony wydarzeń */}
        <h2>{t('eventsList.title')}</h2>

        {events.length === 0 ? (
          <Alert variant="info">{t('eventsList.noEvents')}</Alert>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4 mt-2">
            {events.map((e) => {
              const title = e.title || t('eventsList.noTitle');
              const capacityText =
                typeof e.capacity === 'number' ? e.capacity : t('eventsList.noCapacity');

              let formattedDate = t('eventsList.noDate');
              if (e.date) {
                try {
                  const d = new Date(e.date);
                  if (!isNaN(d)) {
                    formattedDate = format(d, 'PPP p');
                  } else {
                    formattedDate = t('eventsList.invalidDate');
                  }
                } catch {
                  formattedDate = t('eventsList.invalidDate');
                }
              }

              return (
                <Col key={e.id}>
                  <Card>
                    {e.image_url && (
                      <Card.Img
                        variant="top"
                        src={e.image_url}
                        alt={title}
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                      />
                    )}
                    <Card.Body>
                      <Card.Title>{title}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        {formattedDate}
                      </Card.Subtitle>
                      <Card.Text>
                        {e.description
                          ? e.description.length > 100
                            ? e.description.substring(0, 100) + '...'
                            : e.description
                          : t('eventsList.noDescription')}
                      </Card.Text>
                      <Card.Text>
                        {t('eventsList.capacity')}: {capacityText}
                      </Card.Text>
                      <Button variant="primary" onClick={() => navigate(`/events/${e.id}`)}>
                        {t('buttons.viewDetails')}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </>
  );
}
