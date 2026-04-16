from app.core import config
from app.services.email_service import EmailService


class DummySMTP:
    def __init__(self, *args, **kwargs):
        self.calls = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def ehlo(self):
        self.calls.append("ehlo")

    def starttls(self):
        self.calls.append("starttls")

    def login(self, user, password):
        self.calls.append(("login", user, password))

    def send_message(self, message):
        self.calls.append(("send_message", message["To"]))


def test_send_email_uses_ssl_for_port_465(monkeypatch):
    monkeypatch.setattr(config.settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(config.settings, "smtp_port", 465)
    monkeypatch.setattr(config.settings, "smtp_user", "user@example.com")
    monkeypatch.setattr(config.settings, "smtp_password", "secret")
    monkeypatch.setattr(config.settings, "smtp_from_email", "")
    monkeypatch.setattr(config.settings, "smtp_from_name", "Demo Platform")
    monkeypatch.setattr(config.settings, "smtp_secure", "ssl")

    created = {}

    def fake_smtp_ssl(*args, **kwargs):
        client = DummySMTP()
        created["client"] = client
        return client

    monkeypatch.setattr("app.services.email_service.SMTP_SSL", fake_smtp_ssl)

    assert EmailService.send_email("person@example.com", "Subject", "Body") is True
    assert ("login", "user@example.com", "secret") in created["client"].calls
    assert ("send_message", "person@example.com") in created["client"].calls