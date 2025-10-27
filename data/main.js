proj4.defs("EPSG:3301", "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

ol.proj.proj4.register(proj4);
var projection = ol.proj.get('EPSG:3301');

projection.setExtent([40500, 5993000, 1064500, 7017000]);
var wmts = [new ol.layer.Tile({
  title: 'Hallkaart',
  source: new ol.source.WMTS({
    url: 'https://tiles.maaamet.ee/tm/wmts?LAYER=hallkaart',
    layer: 'kaart',
    matrixSet: 'LEST',
    format: 'image/png',
    projection: 'EPSG:3301',
    tileGrid: new ol.tilegrid.WMTS({
      origin: ol.extent.getTopLeft(projection.getExtent()),
      resolutions: [4000, 2000, 1000, 500, 250, 125, 62.5, 31.25, 15.625, 7.8125, 3.90625, 1.953125, 0.9765625, 0.48828125],
      matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    })
    ,attributions: "<a href='https://ttja.ee/lairiba-viies-etapp-2025-2029'>Lairiba viies etapp</a>"
  })
})];
var map = new ol.Map({
  target: 'map',
  layers: wmts,
  view: new ol.View({
    zoom: 3,
    projection: projection
  })
});
map.getView().setCenter(ol.extent.getCenter(projection.getExtent()));



function getRandomHexColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}




let last_name = "";
let group;
for (let i = geojson_array.length - 1; i >= 0; i--) {
//for (let geojson of geojson_array) {
  let geojson = geojson_array[i];

  let features = new ol.format.GeoJSON().readFeatures(geojson, {dataProjection: 'EPSG:3301', featureProjection: 'EPSG:3301'});
  let hex_color = getRandomHexColor();

  let name = features[0].get('name');
  let index = name.lastIndexOf(", ");
  let layer_name = name.substring(index + 2);
  let group_name = name.substring(0, index);

  const layer = new ol.layer.Vector({
      //declutter: true,
      source: new ol.source.Vector({
        //features: new ol.format.GeoJSON().readFeatures(geojson, {dataProjection: 'EPSG:3301', featureProjection: 'EPSG:3301'})
        features: features
      }),
      style: new ol.style.Style({
	stroke: new ol.style.Stroke({ color: hex_color, width: 1 }),
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({ color: hex_color }),
          stroke: new ol.style.Stroke({ color: '#ffffffaa', width: 1 })
        })
      }),
      title: layer_name
    });

  if (group_name !== last_name) {
    group = new ol.layer.Group({
      fold: 'close',
      title: group_name,
      layers: []
    });
    map.addLayer(group);

    last_name = group_name;
  }

  group.getLayers().push(layer);

}// end for


// append legend
map.addControl(new ol.control.LayerSwitcher({
	collapsed: false,
	activationMode: 'click',
	startActive: true,
	groupSelectStyle: 'children'
}));


// popup events
//const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const overlay = new ol.Overlay({
  element: document.getElementById('popup'), //container,
  autoPan: true
});
map.addOverlay(overlay);

closer.onclick = function () {
  overlay.setPosition(undefined);
  return false;
};

map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });
  if (feature) {
    const properties = feature.getProperties();
    
    let html = `<b>${properties['name']}</b><hr><table>`;
    html += `<tr><td>Aadresside arv</td><td>:</td><td>${properties['adsCount']}</td></tr>`;
    html += `<tr><td>Võrgu pikkus (m)</td><td>:</td><td>${properties['networkLength']}</td></tr>`;
    html += `<tr><td>Keskmine ühenduse pikkus (m)</td><td>:</td><td>${properties['avgLenPerAds']}</td></tr>`;
    html += `<tr><th colspan="3"><a href="https://experience.arcgis.com/experience/bc93491dccd940448ce79205e59d8213/page/Leht" target="_blank">SA rahvastiku tihedus</a></th></tr>`;
    html += `<tr><td>1x1km ruute</td><td>:</td><td>${properties['countGridItems']}</td></tr>`;
    html += `<tr><td>Elanike arv</td><td>:</td><td>${properties['sumGridItems']}</td></tr>`;
    html += "</table>";

    content.innerHTML = html;

    overlay.setPosition(evt.coordinate);
  } else {
    overlay.setPosition(undefined);
  }
});

// release variable data
geojson_array = null;