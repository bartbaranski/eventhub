// src/pages/EventFormPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import http from '../api/httpClient';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function EventFormPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { id } = useParams(); // gdy edycja, to id jest w URL
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); // "YYYY-MM-DD"
  const [time, setTime] = useState(''); // "HH:MM"
  const [capacity, setCapacity] = useState(0);
  const [imageURL, setImageURL] = useState(''); // pole na ścieżkę do plakatu
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      // jeżeli id w URL, to wczytujemy dane eventu
      (async () => {
        try {
          const res = await http.get(`/events/${id}`);
          const data = res.data;

          setTitle(data.title);
          setDescription(data.description);

          // data z backendu to np. "2025-06-18T15:30:00Z"
          // rozbijamy na datę i godzinę:
          const dt = new Date(data.date);
          // format YYYY-MM-DD
          setDate(
            dt.getFullYear().toString().padStart(4, '0') + '-' +
            (dt.getMonth() + 1).toString().padStart(2, '0') + '-' +
            dt.getDate().toString().padStart(2, '0')
          );
          // format HH:MM
          setTime(
            dt.getHours().toString().padStart(2, '0') + ':' +
            dt.getMinutes().toString().padStart(2, '0')
          );

          setCapacity(data.capacity);
          setImageURL(data.image_url || '');
        } catch (err) {
          console.error(err);
          setError(t('eventsList.errorLoading'));
        }
      })();
    }
  }, [id, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Połącz date + time w jeden ISO-owy ciąg: "YYYY-MM-DDTHH:MM"
    const dateTimePayload = `${date}T${time}`;

    const payload = {
      title,
      description,
      date_time: dateTimePayload,
      capacity,
      image_url: imageURL,
    };
    console.log('LEC ILE WYŚLĘ:', payload);

    try {
      if (id) {
        // edycja
        await http.put(`/events/${id}`, payload);
      } else {
        // tworzenie
        await http.post('/events', payload);
      }
      navigate('/events');
    } catch (err) {
      console.error('Błąd zapisu:', err.response?.data || err.message);
      setError(t('eventsList.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <Container className="mt-5">
        <Row className="justify-content-md-center">
          <Col md={6}>
            <Card>
              <Card.Body>
                <h2 className="mb-4">
                  {id ? t('eventsList.editEvent') : t('eventsList.createEvent')}
                </h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="title">
                    <Form.Label>{t('eventsList.title')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="description">
                    <Form.Label>{t('eventsList.description')}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="date">
                    <Form.Label>{t('eventsList.date')}</Form.Label>
                    <Form.Control
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="time">
                    <Form.Label>{t('eventsList.time')}</Form.Label>
                    <Form.Control
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="capacity">
                    <Form.Label>{t('eventsList.capacity')}</Form.Label>
                    <Form.Control
                      type="number"
                      value={capacity}
                      min={1}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                  </Form.Group>

                  {/* Pole na URL do plakatu */}
                  <Form.Group className="mb-3" controlId="imageURL">
                    <Form.Label>{t('eventsList.posterURL')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={imageURL}
                      onChange={(e) => setImageURL(e.target.value)}
                      placeholder="/images/event1.jpg"
                    />
                    <Form.Text className="text-muted">
                      {t('eventsList.posterHint')}
                    </Form.Text>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : t('eventsList.save')}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
