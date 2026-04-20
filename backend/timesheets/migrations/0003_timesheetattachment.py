from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("timesheets", "0002_allow_multiple_timesheets_per_week"),
    ]

    operations = [
        migrations.CreateModel(
            name="TimesheetAttachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="timesheet_attachments/%Y/%m/%d/")),
                ("original_name", models.CharField(max_length=255)),
                ("content_type", models.CharField(blank=True, max_length=120)),
                ("size", models.PositiveBigIntegerField(default=0)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "timesheet",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attachments", to="timesheets.timesheet"),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="timesheet_attachments", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "ordering": ("-uploaded_at",),
            },
        ),
    ]
