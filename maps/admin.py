from django.contrib.gis import admin
from .models import Airport, FlightRoute

# Airport admin with map
@admin.register(Airport)
class AirportAdmin(admin.OSMGeoAdmin):
    list_display = ('name', 'iata_code', 'city', 'country', 'is_major_hub')
    search_fields = ('name', 'iata_code', 'city', 'country')
    list_filter = ('country', 'is_major_hub')

    # Map defaults (center on Dublin roughly)
    default_lon = -6.26
    default_lat = 53.35
    default_zoom = 5


# Flight route admin with map
@admin.register(FlightRoute)
class FlightRouteAdmin(admin.OSMGeoAdmin):
    list_display = ('origin', 'destination', 'airline', 'distance_km')
    search_fields = ('airline', 'origin__iata_code', 'destination__iata_code')
    list_filter = ('airline',)

    # Map defaults (Europe view)
    default_lon = 0
    default_lat = 52
    default_zoom = 4
