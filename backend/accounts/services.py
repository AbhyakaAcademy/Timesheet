import hashlib
import os
import secrets
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone

from accounts.models import TenantSignupRequest, User, UserRole
from tenants.models import TenantOrganization, TenantSubscription

SIGNUP_TOKEN_TTL_HOURS = 24


def _get_frontend_base_url():
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def build_username(email: str) -> str:
    local_part = (email.split("@", 1)[0] or "tenant").strip().lower()
    slug = "".join(ch for ch in local_part if ch.isalnum() or ch in {"_", "."}).strip("._")
    username = slug or "tenant"
    base_username = username
    suffix = 2

    while User.objects.filter(username=username).exists():
        username = f"{base_username}{suffix}"
        suffix += 1

    return username


def generate_signup_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@transaction.atomic
def create_or_refresh_tenant_signup_request(*, email, password, organization_name, first_name="", last_name=""):
    normalized_email = email.strip().lower()
    token = generate_signup_token()
    token_hash = hash_token(token)
    expires_at = timezone.now() + timedelta(hours=SIGNUP_TOKEN_TTL_HOURS)

    if User.objects.filter(email__iexact=normalized_email).exists():
        raise ValueError("An account with this email already exists.")

    pending = TenantSignupRequest.objects.filter(email__iexact=normalized_email).first()
    if pending and pending.verified_user_id:
        raise ValueError("An account with this email already exists.")

    password_hash = make_password(password)
    defaults = {
        "organization_name": organization_name.strip(),
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "password_hash": password_hash,
        "verification_token_hash": token_hash,
        "token_expires_at": expires_at,
        "verified_user": None,
        "verified_at": None,
    }

    if pending:
        for key, value in defaults.items():
            setattr(pending, key, value)
        pending.email = normalized_email
        pending.save()
    else:
        pending = TenantSignupRequest.objects.create(email=normalized_email, **defaults)

    return pending, token


def create_tenant_user_from_signup_request(signup_request: TenantSignupRequest) -> User:
    organization_name = signup_request.organization_name.strip() or "Tenant"
    organization = TenantOrganization.objects.create(
        name=organization_name,
        contact_email=signup_request.email,
    )
    TenantSubscription.objects.get_or_create(
        organization=organization,
        defaults={
            "plan_name": "Enterprise",
            "billing_cycle": "Annual",
            "licenses": 500,
            "monthly_recurring_revenue": Decimal("0.00"),
        },
    )

    user = User.objects.create(
        username=build_username(signup_request.email),
        email=signup_request.email,
        first_name=signup_request.first_name,
        last_name=signup_request.last_name,
        role=UserRole.TENANT,
        organization=organization,
        is_active=True,
    )
    user.password = signup_request.password_hash
    user.save(update_fields=["password"])
    return user


def send_signup_verification_email(*, email, organization_name, token):
    verify_url = f"{_get_frontend_base_url()}/verify-email?token={token}"
    subject = "Verify your Abhyaka account"
    from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    if not from_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL or EMAIL_HOST_USER is not configured.")

    html_body = f"""
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Verify your email</h2>
        <p>Your tenant workspace for <strong>{organization_name}</strong> is almost ready.</p>
        <p>Click the button below to verify your email and activate your account.</p>
        <p><a href="{verify_url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify Email</a></p>
        <p style="margin-top:16px;font-size:12px;color:#475569">If the button does not work, paste this link into your browser: {verify_url}</p>
      </div>
    """
    message = EmailMultiAlternatives(
        subject=subject,
        body=f"Verify your email for {organization_name}: {verify_url}",
        from_email=from_email,
        to=[email],
    )
    try:
        message.attach_alternative(html_body, "text/html")
        sent = message.send(fail_silently=False)
        if sent == 0:
            raise RuntimeError("Email delivery failed. Check SMTP configuration.")
    except Exception as error:
        raise RuntimeError(f"Unable to send verification email: {error}") from error
