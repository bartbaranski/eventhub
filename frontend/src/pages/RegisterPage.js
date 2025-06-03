// src/pages/RegisterPage.js
import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import NavBar from '../components/NavBar';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError('');

    const result = await register(email, password, role);
    setLoadingSubmit(false);

    if (!result.success) {
      setError(result.message || 'Registration failed');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <NavBar />
      <Container className="mt-5">
        <Row className="justify-content-md-center">
          <Col md={4}>
            <Card>
              <Card.Body>
                <h2 className="mb-4">{t('register.title')}</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="registerEmail">
                    <Form.Label>{t('register.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('register.email')}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="registerPassword">
                    <Form.Label>{t('register.password')}</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('register.password')}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="registerRole">
                    <Form.Label>{t('register.role')}</Form.Label>
                    <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="organizer">{t('register.organizer')}</option>
                      <option value="participant">{t('register.participant')}</option>
                    </Form.Select>
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100" disabled={loadingSubmit}>
                    {loadingSubmit ? <Spinner animation="border" size="sm" /> : t('register.submit')}
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
