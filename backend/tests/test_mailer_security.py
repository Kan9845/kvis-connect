import logging

import pytest

from app.core import mailer


def test_missing_graph_configuration_fails_without_logging_sensitive_content(
    monkeypatch, caplog
):
    monkeypatch.setattr(mailer.settings, "MS_TENANT_ID", "")
    monkeypatch.setattr(mailer.settings, "MS_CLIENT_ID", "")
    monkeypatch.setattr(mailer.settings, "MS_CLIENT_SECRET", "")
    monkeypatch.setattr(mailer.settings, "MS_SENDER", "")
    recipient = "private@example.com"
    secret_body = "verification code 123456"

    with caplog.at_level(logging.ERROR), pytest.raises(
        mailer.EmailDeliveryError, match="not configured"
    ):
        mailer.send_email(recipient, "Sensitive subject", secret_body)

    assert recipient not in caplog.text
    assert "Sensitive subject" not in caplog.text
    assert secret_body not in caplog.text


def test_graph_failure_is_wrapped_without_logging_message_content(monkeypatch, caplog):
    monkeypatch.setattr(mailer.settings, "MS_TENANT_ID", "tenant")
    monkeypatch.setattr(mailer.settings, "MS_CLIENT_ID", "client")
    monkeypatch.setattr(mailer.settings, "MS_CLIENT_SECRET", "secret")
    monkeypatch.setattr(mailer.settings, "MS_SENDER", "sender@example.com")
    monkeypatch.setattr(mailer, "_get_graph_token", lambda: "access-token")

    def fail_request(*_args, **_kwargs):
        raise mailer.httpx.ConnectError("provider details")

    monkeypatch.setattr(mailer.httpx, "post", fail_request)

    with caplog.at_level(logging.ERROR), pytest.raises(
        mailer.EmailDeliveryError, match="delivery failed"
    ):
        mailer.send_email(
            "private@example.com", "Sensitive subject", "verification code 123456"
        )

    assert "private@example.com" not in caplog.text
    assert "Sensitive subject" not in caplog.text
    assert "verification code 123456" not in caplog.text
