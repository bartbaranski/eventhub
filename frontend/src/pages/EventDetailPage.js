// src/pages/EventDetailPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import http from '../api/httpClient';
import NavBar from '../components/NavBar';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
} from 'react-bootstrap';
import { AuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function EventDetailPage() {
  const { id } = useParams();         // pobierz ID z URL: /events/:id
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stan dla modalu rezerwacji
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [tickets, setTickets] = useState(1);
  const [reserveError, setReserveError] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState(false);

  // Pobranie szczegółów eventu – useEffect z wewnętrzną async funkcją
  useEffect(() => {
    (async () => {
      try {
        const response = await http.get(`/events/${id}`);
        setEvent(response.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load event details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Obsługa usuwania eventu (tylko organizator)
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await http.delete(`/events/${id}`);
        navigate('/events');
      } catch (err) {
        console.error(err);
        alert('Error deleting event');
      }
    }
  };

  // Obsługa otwarcia modalu rezerwacji
  const openReserveModal = () => {
    setTickets(1);
    setReserveError('');
    setReserveSuccess(false);
    setShowReserveModal(true);
  };
  const closeReserveModal = () => setShowReserveModal(false);

  // Obsługa potwierdzenia rezerwacji
  const handleReserve = async (e) => {
    e.preventDefault();
    setReserveError('');
    try {
      await http.post('/reservations', { event_id: parseInt(id, 10), tickets });
      setReserveSuccess(true);
      setTimeout(() => {
        setShowReserveModal(false);
        navigate('/reservations');
      }, 1500);
    } catch (err) {
      console.error(err);
      setReserveError('Unable to make reservation');
    }
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

  if (error || !event) {
    return (
      <>
        <NavBar />
        <Container className="mt-5">
          <Alert variant="danger">{error || 'Event not found'}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />

      <Container className="mt-4">
        <Row>
          <Col md={8} className="mx-auto">
            <Card>
              {/* Wyświetlenie plakatu, jeśli istnieje URL */}
              {event.image_url && (
                <Card.Img
                  variant="top"
                  src={event.image_url}
                  alt={event.title}
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
              )}
              <Card.Body>
                <Card.Title>{event.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {format(new Date(event.date), 'PPP p')}
                </Card.Subtitle>
                <Card.Text>{event.description}</Card.Text>
                <Card.Text>
                  <strong>Capacity:</strong> {event.capacity}
                </Card.Text>
                <Card.Text>
                  <strong>Organizer ID:</strong> {event.organizer_id}
                </Card.Text>

                {/* Przycisk Edit/Delete dla organizatora */}
                {user.role === 'organizer' && user.id === event.organizer_id && (
                  <>
                    <Button
                      variant="warning"
                      className="me-2"
                      onClick={() => navigate(`/events/${id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                      Delete
                    </Button>
                  </>
                )}

                {/* Przycisk Reserve dla uczestnika */}
                {user.role === 'participant' && (
                  <Button variant="primary" onClick={openReserveModal}>
                    Reserve Tickets
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal do rezerwacji */}
      <Modal show={showReserveModal} onHide={closeReserveModal}>
        <Modal.Header closeButton>
          <Modal.Title>Reserve Tickets</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reserveSuccess && <Alert variant="success">Reservation successful!</Alert>}
          {reserveError && <Alert variant="danger">{reserveError}</Alert>}
          <Form onSubmit={handleReserve}>
            <Form.Group className="mb-3" controlId="formTickets">
              <Form.Label>Number of Tickets</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={event.capacity}
                value={tickets}
                onChange={(e) => setTickets(parseInt(e.target.value, 10))}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Confirm Reservation
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
