from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("timesheets", "0004_manualentryrequest"),
    ]

    operations = [
        migrations.AlterField(
            model_name="manualentryrequest",
            name="request_type",
            field=models.CharField(max_length=120),
        ),
    ]
