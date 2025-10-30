// ==========================================
// Flight Connections Map + Info Panel

const map = L.map('map').setView([53.35, -6.26], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let routeLayer = null;
let airportLayer = null;
let selectedAirport = null;

// Styles
const defaultStyle = { radius: 6, fillColor: "#0074D9", color: "#fff", weight: 1, opacity: 1, fillOpacity: 0.9 };
const selectedStyle = { radius: 8, fillColor: "#FFD700", color: "#000", weight: 2, opacity: 1, fillOpacity: 1.0 };
const connectedStyle = { radius: 6, fillColor: "#2ECC40", color: "#fff", weight: 1, opacity: 1, fillOpacity: 0.9 };

// Elements
const infoBox = document.getElementById("infoBox");
const routePanel = document.getElementById("routePanel");
const routeList = document.getElementById("routeList");
const panelTitle = document.getElementById("panelTitle");

// Load airports
fetch('/api/airports/')
  .then(res => res.json())
  .then(data => {
    airportLayer = L.geoJSON(data, {
      pointToLayer: (f, latlng) => L.circleMarker(latlng, defaultStyle),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.bindPopup(`
          <b>${props.name}</b><br>${props.city}, ${props.country}<br>Code: ${props.iata_code}
        `);
        layer.on('click', () => loadRoutes(props.iata_code, props.name, layer));
      }
    }).addTo(map);

    const bounds = airportLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds);
  });

// Load routes for selected airport
function loadRoutes(iata, airportName, layerClicked) {
  if (selectedAirport === layerClicked) return;
  selectedAirport = layerClicked;

  airportLayer.eachLayer(l => l.setStyle(defaultStyle));
  layerClicked.setStyle(selectedStyle);

  infoBox.innerHTML = `<em>Loading routes from ${airportName}...</em>`;
  routePanel.classList.add('hidden');

  fetch(`/api/airports/routes/?origin=${iata}`)
    .then(res => res.json())
    .then(data => {
      if (routeLayer) map.removeLayer(routeLayer);

      routeLayer = L.geoJSON(data, {
        style: { color: "red", weight: 2 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(`<b>${p.origin} → ${p.destination}</b><br>Distance: ${p.distance_km.toFixed(1)} km`);
        }
      }).addTo(map);

      highlightConnectedAirports(data);
      populateRoutePanel(data, airportName);

      const bounds = routeLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds);

      infoBox.innerHTML = `<b>${airportName}</b>: Showing ${data.features.length} route(s).`;
    })
    .catch(() => {
      infoBox.innerHTML = `<b>${airportName}</b>: No routes found.`;
      routePanel.classList.add('hidden');
    });
}

// Highlight connected airports
function highlightConnectedAirports(routeData) {
  const connectedIATAs = routeData.features.map(f => f.properties.destination);

  airportLayer.eachLayer(l => {
    const props = l.feature.properties;
    if (connectedIATAs.includes(props.iata_code)) {
      l.setStyle(connectedStyle);
    } else if (props.iata_code !== selectedAirport.feature.properties.iata_code) {
      l.setStyle({ ...defaultStyle, fillOpacity: 0.3 });
    }
  });
}

// Populate info panel
function populateRoutePanel(routeData, airportName) {
  routeList.innerHTML = "";
  panelTitle.innerText = `Routes from ${airportName}`;

  routeData.features.forEach((f, idx) => {
    const li = document.createElement("li");
    li.textContent = `${f.properties.origin} → ${f.properties.destination} (${f.properties.distance_km.toFixed(1)} km)`;
    li.onclick = () => zoomToRoute(idx);
    routeList.appendChild(li);
  });

  routePanel.classList.remove('hidden');
}

// Zoom to a specific route when clicked
function zoomToRoute(index) {
  if (!routeLayer) return;
  const featureLayer = Object.values(routeLayer._layers)[index];
  if (!featureLayer) return;

  featureLayer.setStyle({ color: "yellow", weight: 4 });
  map.fitBounds(featureLayer.getBounds());
  setTimeout(() => routeLayer.resetStyle(featureLayer), 800);
}

// Clear routes + reset styles
document.getElementById("clearBtn").onclick = () => {
  if (routeLayer) map.removeLayer(routeLayer);
  selectedAirport = null;
  routePanel.classList.add('hidden');
  airportLayer.eachLayer(l => l.setStyle(defaultStyle));
  infoBox.innerHTML = "<strong>Click an airport</strong> to view its connections.";
};
