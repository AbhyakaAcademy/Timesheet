from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0002_dashboardactivitylog"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenantorganization",
            name="billing_address",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="tenantorganization",
            name="payment_methods",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
