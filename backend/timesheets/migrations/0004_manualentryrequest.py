from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("timesheets", "0003_timesheetattachment"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ManualEntryRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("request_type", models.CharField(choices=[("MISSED_PUNCH_IN", "Missed Punch In"), ("MISSED_PUNCH_OUT", "Missed Punch Out"), ("MISSED_BOTH", "Missed Both")], max_length=20)),
                ("request_date", models.DateField()),
                ("comment", models.TextField()),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], default="PENDING", max_length=20)),
                ("manager_comment", models.CharField(blank=True, max_length=255)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("approved_entry", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="manual_entry_requests", to="timesheets.timeentry")),
                ("employee", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="manual_entry_requests", to=settings.AUTH_USER_MODEL)),
                ("resolved_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="resolved_manual_entry_requests", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ("-created_at", "-id"),
            },
        ),
    ]
