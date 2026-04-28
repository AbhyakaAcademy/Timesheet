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

from accounts.models import PasswordResetRequest, TenantSignupRequest, User, UserInvitation, UserRole
from tenants.models import TenantOrganization, TenantSubscription

SIGNUP_TOKEN_TTL_HOURS = 24
USER_INVITATION_TTL_HOURS = 72
PASSWORD_RESET_TTL_HOURS = 2


def _get_frontend_base_url():
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def build_verification_url(token: str) -> str:
    return f"{_get_frontend_base_url()}/verify-email?token={token}"


def build_invitation_url(token: str) -> str:
    return f"{_get_frontend_base_url()}/accept-invite?token={token}"


def build_password_reset_url(token: str) -> str:
    return f"{_get_frontend_base_url()}/reset-password?token={token}"


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


def refresh_signup_verification_token(signup_request: TenantSignupRequest) -> str:
    token = generate_signup_token()
    signup_request.verification_token_hash = hash_token(token)
    signup_request.token_expires_at = timezone.now() + timedelta(hours=SIGNUP_TOKEN_TTL_HOURS)
    signup_request.verified_at = None
    signup_request.save(update_fields=["verification_token_hash", "token_expires_at", "verified_at", "updated_at"])
    return token


def generate_user_invitation(user: User, invited_by: User | None = None) -> tuple[UserInvitation, str]:
    token = generate_signup_token()
    invitation = UserInvitation.objects.filter(user=user).first()
    if invitation is None:
        invitation = UserInvitation(user=user)
    invitation.invited_by = invited_by
    invitation.invitation_token_hash = hash_token(token)
    invitation.token_expires_at = timezone.now() + timedelta(hours=USER_INVITATION_TTL_HOURS)
    invitation.accepted_at = None
    invitation.save()
    return invitation, token


def generate_password_reset_request(user: User) -> tuple[PasswordResetRequest, str]:
    token = generate_signup_token()
    reset_request = PasswordResetRequest.objects.filter(user=user).first()
    if reset_request is None:
        reset_request = PasswordResetRequest(user=user)
    reset_request.reset_token_hash = hash_token(token)
    reset_request.token_expires_at = timezone.now() + timedelta(hours=PASSWORD_RESET_TTL_HOURS)
    reset_request.used_at = None
    reset_request.save()
    return reset_request, token


def send_user_invitation_email(*, user: User, invited_by: User | None = None, invited_by_name: str = ""):
    invitation, token = generate_user_invitation(user, invited_by=invited_by)
    invite_url = build_invitation_url(token)
    subject = f"You've been invited to join Abhyaka as {user.role.title()}"
    from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    email_backend = getattr(settings, "EMAIL_BACKEND", "")
    smtp_backend = "django.core.mail.backends.smtp.EmailBackend"
    smtp_credentials_missing = not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD

    if settings.DEBUG and (not from_email or (email_backend == smtp_backend and smtp_credentials_missing)):
        return {
            "delivery_mode": "development",
            "invitation_url": invite_url,
        }

    if not from_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL or EMAIL_HOST_USER is not configured.")

    inviter_text = invited_by_name or "your tenant admin"
    html_body = f"""
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">You're invited to join Abhyaka</h2>
        <p>Hi there,</p>
        <p>{inviter_text} invited you to join <strong>{user.organization.name}</strong> as a <strong>{user.role.title()}</strong>.</p>
        <p>Click the button below to set your password and activate your account.</p>
        <p><a href="{invite_url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Accept Invite</a></p>
        <p style="margin:16px 0 0">This invite link will expire in {USER_INVITATION_TTL_HOURS} hours.</p>
        <p style="margin-top:16px;font-size:12px;color:#475569">If the button does not work, paste this link into your browser: {invite_url}</p>
      </div>
    """
    message = EmailMultiAlternatives(
        subject=subject,
        body=(
            f"Hi,\n\n"
            f"{inviter_text} invited you to join {user.organization.name} on Abhyaka as a {user.role.title()}.\n"
            f"Set your password and activate your account using this link:\n\n{invite_url}\n\n"
            f"This invite link will expire in {USER_INVITATION_TTL_HOURS} hours."
        ),
        from_email=from_email,
        to=[user.email],
    )
    try:
        message.attach_alternative(html_body, "text/html")
        sent = message.send(fail_silently=False)
        if sent == 0:
            raise RuntimeError("Email delivery failed. Check SMTP configuration.")
    except Exception as error:
        if settings.DEBUG and (not from_email or (email_backend == smtp_backend and smtp_credentials_missing)):
            return {
                "delivery_mode": "development",
                "invitation_url": invite_url,
            }
        raise RuntimeError(f"Unable to send invitation email: {error}") from error

    return {
        "delivery_mode": "email",
        "invitation_url": invite_url,
    }


def send_password_reset_email(*, user: User):
    reset_request, token = generate_password_reset_request(user)
    reset_url = build_password_reset_url(token)
    subject = "Reset your Abhyaka password"
    from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    email_backend = getattr(settings, "EMAIL_BACKEND", "")
    smtp_backend = "django.core.mail.backends.smtp.EmailBackend"
    smtp_credentials_missing = not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD

    if settings.DEBUG and (not from_email or (email_backend == smtp_backend and smtp_credentials_missing)):
        return {
            "delivery_mode": "development",
            "reset_url": reset_url,
        }

    if not from_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL or EMAIL_HOST_USER is not configured.")

    html_body = f"""
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your Abhyaka password.</p>
        <p><a href="{reset_url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Reset Password</a></p>
        <p style="margin:16px 0 0">This link will expire in {PASSWORD_RESET_TTL_HOURS} hours.</p>
        <p style="margin-top:16px;font-size:12px;color:#475569">If the button does not work, paste this link into your browser: {reset_url}</p>
        <p style="margin-top:16px;font-size:12px;color:#475569">If you did not request this, you can ignore this email.</p>
      </div>
    """
    message = EmailMultiAlternatives(
        subject=subject,
        body=(
            f"Hi,\n\n"
            f"We received a request to reset your Abhyaka password.\n"
            f"Use this link to set a new password:\n\n{reset_url}\n\n"
            f"This link will expire in {PASSWORD_RESET_TTL_HOURS} hours.\n\n"
            f"If you did not request this, you can ignore this email."
        ),
        from_email=from_email,
        to=[user.email],
    )
    try:
        message.attach_alternative(html_body, "text/html")
        sent = message.send(fail_silently=False)
        if sent == 0:
            raise RuntimeError("Email delivery failed. Check SMTP configuration.")
    except Exception as error:
        if settings.DEBUG and (not from_email or (email_backend == smtp_backend and smtp_credentials_missing)):
            return {
                "delivery_mode": "development",
                "reset_url": reset_url,
            }
        raise RuntimeError(f"Unable to send password reset email: {error}") from error

    return {
        "delivery_mode": "email",
        "reset_url": reset_url,
    }


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
    verify_url = build_verification_url(token)
    subject = "Verify your Abhyaka account"
    from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    email_backend = getattr(settings, "EMAIL_BACKEND", "")
    smtp_backend = "django.core.mail.backends.smtp.EmailBackend"
    smtp_credentials_missing = not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD

    if settings.DEBUG and (not from_email or (email_backend == smtp_backend and smtp_credentials_missing)):
        return {
            "delivery_mode": "development",
            "verification_url": verify_url,
        }

    if not from_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL or EMAIL_HOST_USER is not configured.")

    html_body = f"""
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Thanks for your interest in Abhyaka</h2>
        <p>Hi there,</p>
        <p>Thanks for signing up for <strong>{organization_name}</strong>. Please verify your email address to activate your account.</p>
        <p><a href="{verify_url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify Email Address</a></p>
        <p style="margin:16px 0 0">This verification link will expire in {SIGNUP_TOKEN_TTL_HOURS} hours.</p>
        <p style="margin-top:16px;font-size:12px;color:#475569">If the button does not work, paste this link into your browser: {verify_url}</p>
        <p style="margin-top:16px;font-size:12px;color:#475569">If you did not request this, you can safely ignore this email.</p>
      </div>
    """
    message = EmailMultiAlternatives(
        subject=subject,
        body=(
            f"Hi,\n\n"
            f"Thanks for your interest in Abhyaka and for signing up for {organization_name}.\n"
            f"Please verify your email address using this link:\n\n{verify_url}\n\n"
            f"This link will expire in {SIGNUP_TOKEN_TTL_HOURS} hours.\n\n"
            f"If you did not request this, you can ignore this email."
        ),
        from_email=from_email,
        to=[email],
    )
    try:
        message.attach_alternative(html_body, "text/html")
        sent = message.send(fail_silently=False)
        if sent == 0:
            raise RuntimeError("Email delivery failed. Check SMTP configuration.")
    except Exception as error:
        if settings.DEBUG and (not from_email or (email_backend == smtp_backend and smtp_credentials_missing)):
            return {
                "delivery_mode": "development",
                "verification_url": verify_url,
            }
        raise RuntimeError(f"Unable to send verification email: {error}") from error

    return {
        "delivery_mode": "email",
        "verification_url": verify_url,
    }
