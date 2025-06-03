// src/components/NavBar.js
import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useFontSize } from '../contexts/FontSizeContext';
import { useContrast } from '../contexts/ContrastContext';

export default function NavBar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const { increase, decrease, reset } = useFontSize();
  const { isHighContrast, toggleContrast } = useContrast();
  const navigate = useNavigate();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          EventHub
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Przyciski zmiany rozmiaru tekstu */}
            <Button variant="outline-secondary" size="sm" onClick={decrease} className="me-1">
              A–
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={increase} className="me-1">
              A+
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={reset} className="me-3">
              100%
            </Button>

            {/* Przycisk przełączania kontrastu */}
            <Button
              variant={isHighContrast ? 'dark' : 'outline-dark'}
              size="sm"
              onClick={toggleContrast}
              className="me-3"
            >
              {isHighContrast ? t('navbar.normalContrast') : t('navbar.highContrast')}
            </Button>

            {/* Przełącznik języka */}
            <NavDropdown title={i18n.language === 'pl' ? 'PL' : 'EN'} id="lang-dropdown" className="me-3">
              <NavDropdown.Item onClick={() => changeLanguage('pl')}>PL</NavDropdown.Item>
              <NavDropdown.Item onClick={() => changeLanguage('en')}>EN</NavDropdown.Item>
            </NavDropdown>

            {user ? (
              <>
                <Nav.Link as={Link} to="/events">
                  {t('navbar.events')}
                </Nav.Link>
                <Nav.Link as={Link} to="/reservations">
                  {t('navbar.reservations')}
                </Nav.Link>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="ms-2"
                >
                  {t('navbar.logout')}
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  {t('navbar.login')}
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  {t('navbar.register')}
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
