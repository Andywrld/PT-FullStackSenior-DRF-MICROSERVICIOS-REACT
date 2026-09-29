from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_unaccent_extension'),
    ]

    operations = [
        TrigramExtension(),
    ]
