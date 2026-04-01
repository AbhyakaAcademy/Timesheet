from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("timesheets", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="timesheet",
            options={"ordering": ("-week_start", "-created_at")},
        ),
        migrations.AlterUniqueTogether(
            name="timesheet",
            unique_together=set(),
        ),
    ]

