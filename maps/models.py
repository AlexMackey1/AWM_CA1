from django.contrib.gis.db import models
from django.contrib.gis.geos import LineString


class Airport(models.Model):
    name = models.CharField(max_length=120)
    iata_code = models.CharField(max_length=10, unique=True)
    city = models.CharField(max_length=120, blank=True, default="")
    country = models.CharField(max_length=120, blank=True, default="")
    geom = models.PointField(srid=4326)
    altitude_ft = models.IntegerField(null=True, blank=True)
    is_major_hub = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["iata_code"]),
            models.Index(fields=["country"]),
            models.Index(fields=["city"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.iata_code})"


class FlightRoute(models.Model):
    origin = models.ForeignKey(Airport, on_delete=models.CASCADE, related_name='departures')
    destination = models.ForeignKey(Airport, on_delete=models.CASCADE, related_name='arrivals')
    airline = models.CharField(max_length=120, blank=True, default="")
    geom = models.LineStringField(srid=4326, null=True, blank=True)
    distance_km = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = (("origin", "destination", "airline"),)
        indexes = [models.Index(fields=["airline"])]

    def save(self, *args, **kwargs):
        if self.origin_id and self.destination_id:
            self.geom = LineString(self.origin.geom, self.destination.geom)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.origin.iata_code} → {self.destination.iata_code} ({self.airline or '—'})"
