from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Airport, FlightRoute
from .serializers import AirportSerializer, FlightRouteSerializer


# Frontend map page
def index(request):
    return render(request, "maps/index.html")


# Airports API
class AirportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Returns airports as a valid GeoJSON FeatureCollection.
    Adds a /api/airports/routes/?origin=<IATA> helper for convenience.
    """
    queryset = Airport.objects.all()
    serializer_class = AirportSerializer

    # Base list: all airports as FeatureCollection
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        geojson = {
            "type": "FeatureCollection",
            "features": serializer.data,
        }
        return Response(geojson)

    # Extra route: filter routes by origin IATA code
    @action(detail=False, methods=["get"])
    def routes(self, request):
        origin_code = request.query_params.get("origin")
        if not origin_code:
            return Response({"error": "origin parameter required"}, status=400)

        routes = FlightRoute.objects.filter(origin__iata_code__iexact=origin_code)
        serializer = FlightRouteSerializer(routes, many=True)
        geojson = {
            "type": "FeatureCollection",
            "features": serializer.data,
        }
        return Response(geojson)


# Flight Routes API
class FlightRouteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Returns flight routes as a valid GeoJSON FeatureCollection.
    Optional filter: ?origin=<IATA_CODE>
    """
    queryset = FlightRoute.objects.all()
    serializer_class = FlightRouteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        origin = self.request.query_params.get("origin")
        if origin:
            queryset = queryset.filter(origin__iata_code__iexact=origin)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        geojson = {
            "type": "FeatureCollection",
            "features": serializer.data,
        }
        return Response(geojson)
