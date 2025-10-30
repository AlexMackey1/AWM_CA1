from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from maps.views import AirportViewSet, FlightRouteViewSet, index

router = DefaultRouter()
router.register(r'airports', AirportViewSet, basename='airports')
router.register(r'routes', FlightRouteViewSet, basename='routes')

urlpatterns = [
    path('', index, name='index'), # Frontend map page
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
