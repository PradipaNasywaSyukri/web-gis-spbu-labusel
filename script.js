// Inisialisasi peta
var map = L.map("map", {
  center: [1.8948879699376124, 100.08366338761581], // Lokasi Kabupaten Labuhanbatu Selatan
  zoom: 10,
});

// === Basemap ===
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

var esriSat = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri",
  });

var cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; CartoDB",
  subdomains: "abcd",
  maxZoom: 19,
});

var topoMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "© OpenTopoMap",
});

// Custom Icon (opsional)
var spbuIcon = L.icon({
  iconUrl: './aset/icon-spbu.png', // opsional
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

var baseMaps = {
  "Open Street Map": osm,
  "Esri World Imagery": esriSat,
  "CartoDB Light": cartoLight,
  "Open Topo Map": topoMap,
};

L.control.layers(baseMaps).addTo(map);

// === Geocoder (Search Box) ===
L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Cari lokasi...",
  position: "topleft",
}).addTo(map);

// === Scale Bar ===
L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

// Load data GeoJSON
fetch('data/spbu_labusel1.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: spbuIcon });
      },
      onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const popupContent = `
          <b><strong>${props.Nama}</strong></b><br/>
          <b>Kode SPBU:</b> ${props.Kode_SPBU}<br/>
          <b>Alamat:</b> ${props.Alamat}<br/>
          <b>Desa:</b> ${props.Desa}<br/>
          <b>Kecamatan:</b> ${props.Kecamatan}<br/>
          <b>Jenis:</b> ${props.Jenis}<br/>
          <b>Tipe:</b> ${props.Tipe}<br/>
          <b>Latitude:</b> ${feature.geometry.coordinates[1]}<br/>
          <b>Longitude:</b> ${feature.geometry.coordinates[0]}<br/>
          <b>Google Maps:</b> <a href="${props.Link_Gmaps}" target="_blank">Lihat di Google Maps</a>
        `;
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Style umum untuk garis dan polygon
const styleBatasKec = { color: '#ffd47f', weight: 1.5, dashArray: '3' };
const styleBatasKabLine = { color: '#000000', weight: 2, dashArray: '5' };
const styleSungai = { color: '#3399FF', weight: 0.1 };

// Fungsi untuk menentukan warna berdasarkan nama kecamatan
function getColorByKecamatan(name) {
  const colors = {
    'Kampung Rakyat': '#62d266',
    'Kota Pinang': '#e7eb77',
    'Silangkitang': '#34dce2',
    'Sungai Kanan': '#524fdd',
    'Torgamba': '#dc59d8',
  };
  return colors[name] || '#999999'; // Warna default jika tidak ada kecocokan
}

// Style jalan berdasarkan klasifikasi "highway"
function styleJalan(feature) {
  const klasifikasi = feature.properties.highway;

  switch (klasifikasi) {
    case 'trunk':
      return { color: '#f7801e', weight: 2 }; // merah untuk jalan utama
    case 'secondary':
      return { color: '#c6e20d', weight: 1.5 }; // oranye untuk jalan sekunder
    case 'tertiary':
      return { color: '#cf48bd', weight: 1 }; // kuning untuk jalan tersier
    default:
      return { color: '#e2e8e9', weight: 0.2 }; // abu-abu untuk jalan lainnya
  }
}

// Batas Kecamatan (Polygon)
fetch('data/batas_kecamatan_polygon.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { 
      style: function(feature) {
        return {
          fillColor: getColorByKecamatan(feature.properties.NAME_3),
          fillOpacity: 1,
          color: 'transparent',
          weight: 0            
        };
      },
      onEachFeature: function (feature, layer) {
        const namaKecamatan = feature.properties.NAME_3;

        // Tambahkan popup jika dibutuhkan
        layer.bindPopup(`<strong>Kecamatan ${namaKecamatan}</strong>`);

        // Tambahkan label di tengah polygon
        const center = layer.getBounds().getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: 'label-kecamatan',
            html: `<b>${namaKecamatan}</b>`,
            iconSize: [100, 20]
          })
        });
        label.addTo(map);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Batas Kecamatan (Line)
fetch('data/batas_kecamatan_line.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKec }).addTo(map);
  });

// Batas Kabupaten (Line)
fetch('data/batas_kabupaten_line.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKabLine }).addTo(map);
  });

  // Jalan
fetch('data/jalan.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleJalan }).addTo(map);
  });

// Sungai
fetch('data/sungai.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleSungai }).addTo(map);
  });
