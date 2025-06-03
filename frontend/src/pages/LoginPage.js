// src/pages/LoginPage.js
import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import NavBar from '../components/NavBar';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError('');

    const result = await login(email, password);
    setLoadingSubmit(false);

    if (!result.success) {
      setError(result.message || t('login.invalidCredentials'));
    } else {
      navigate('/events');
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
                <h2 className="mb-4">{t('login.title')}</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label>{t('login.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.email')}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>{t('login.password')}</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.password')}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100" disabled={loadingSubmit}>
                    {loadingSubmit ? <Spinner animation="border" size="sm" /> : t('login.submit')}
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
