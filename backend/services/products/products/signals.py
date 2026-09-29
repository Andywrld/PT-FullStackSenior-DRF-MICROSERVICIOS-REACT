from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from . import catalog_cache
from .models import Category, Product, ProductImage


@receiver(post_delete, sender=ProductImage)
def delete_image_file(sender, instance, **kwargs):
    # on_commit keeps the file on rollback; robust=True: a storage outage can't turn a committed delete into a 500.
    name, storage = instance.image.name, instance.image.storage
    if name:
        transaction.on_commit(lambda: storage.delete(name), robust=True)


@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
@receiver(post_save, sender=Category)
@receiver(post_delete, sender=Category)
@receiver(post_save, sender=ProductImage)
@receiver(post_delete, sender=ProductImage)
def invalidate_catalog_cache(sender, **kwargs):
    # After commit, or a concurrent reader could re-cache old data. queryset.update() and raw SQL
    # send no signals: they must call catalog_cache.bump_version() themselves.
    transaction.on_commit(catalog_cache.bump_version, robust=True)
