from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_stock_deduction'),
    ]

    operations = [
        UnaccentExtension(),
    ]
