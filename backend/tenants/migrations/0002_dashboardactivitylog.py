from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DashboardActivityLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("actor_name", models.CharField(blank=True, max_length=150)),
                ("actor_email", models.EmailField(blank=True, max_length=254)),
                ("actor_role", models.CharField(blank=True, max_length=40)),
                ("dashboard", models.CharField(max_length=40)),
                ("path", models.CharField(blank=True, max_length=255)),
                ("event_type", models.CharField(max_length=40)),
                ("severity", models.CharField(default="info", max_length=20)),
                ("summary", models.CharField(max_length=180)),
                ("details", models.TextField(blank=True)),
                ("duration_ms", models.PositiveIntegerField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="dashboard_activity_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="dashboard_activity_logs",
                        to="tenants.tenantorganization",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at", "-id"),
            },
        ),
    ]
