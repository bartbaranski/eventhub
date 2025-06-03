// src/pages/HomePage.js
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <NavBar />

      <Container className="mt-5">
        <Row className="justify-content-center text-center">
          <Col md={8}>
            <h1 className="mb-4">{t('home.title')}</h1>
            <p className="lead">{t('home.lead')}</p>
            <p>{t('home.organizerInfo')}</p>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
                {t('home.loginButton')}
              </Button>
              <Button variant="outline-primary" size="lg" onClick={() => navigate('/register')}>
                {t('home.registerButton')}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
