// Initialize map
console.log('Map div:', document.getElementById('map'));
const map = L.map('map').setView([53.35, -6.26], 5);

// Add base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let routeLayer = null;

// Load airports
fetch('/api/airports/')
  .then(res => res.json())
  .then(data => {
    const airportLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#0074D9",
          color: "#fff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.9
        });
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.bindPopup(`
          <b>${props.name}</b><br>
          ${props.city}, ${props.country}<br>
          Code: ${props.iata_code}
        `);
        layer.on('click', () => loadRoutes(props.iata_code, props.name));
      }
    }).addTo(map);

    const bounds = airportLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds);
  });

// Load routes for selected airport
function loadRoutes(iata, airportName) {
  fetch(`/api/airports/routes/?origin=${iata}`)
    .then(res => res.json())
    .then(data => {
      if (routeLayer) map.removeLayer(routeLayer);

      routeLayer = L.geoJSON(data, {
        style: { color: "red", weight: 2 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(`
            <b>${p.origin} → ${p.destination}</b><br>
            Distance: ${p.distance_km.toFixed(1)} km
          `);
        }
      }).addTo(map);

      const bounds = routeLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds);

      document.getElementById("infoBox").innerHTML =
        `<b>${airportName}</b>: Showing ${data.features.length} route(s).`;
    });
}

// Clear routes
document.getElementById("clearBtn").onclick = () => {
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
    document.getElementById("infoBox").innerHTML =
      "<strong>Click an airport</strong> to view its connections.";
  }
};
