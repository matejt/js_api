
require([
    "dojo/on",
    "dojo/parser",
    "agsjs/dijit/TOC",
    "dojo/_base/array",
    "dojo/store/Memory",
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/dijit/Legend",
    "esri/InfoTemplate",
    "esri/dijit/BasemapGallery",
    "esri/geometry/Extent",
    "esri/SpatialReference",
    "esri/dijit/Measurement",
    "dijit/form/ComboBox",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/AccordionContainer",
    "dijit/layout/AccordionPane",
    "dojox/layout/ExpandoPane",
    "dijit/TitlePane",
    "dojo/domReady!"], function (
        on,
        parser,
        TOC,
        arrayUtils,
        Memory,
        Map,
        FeatureLayer,
        TiledLayer,
        DynamicLayer,
        Legend,
        InfoTemplate,
        BasemapGallery,
        Extent,
        SpatialReference,
        Measurement,
        ComboBox
        ) {
            parser.parse();

            initExtent = new Extent(-99.4081,28.0324,-98.8030,28.6458, new SpatialReference({ wkid:4326 }));

            var map = new Map("map",{
                basemap:"streets",
                extent: initExtent,
                sliderStyle:"large"
            });

            var json = {title:"Attributes",content:"<tr>API: <td>${API}</tr></td><br><tr>Operator: <td>${operatorName}</tr><br><tr>objectId: <td>${OBJECTID}</tr></td>"}
            var infoTemplate = new InfoTemplate("Well Information", "${*}");
//            rigsUrlFeatureLayer = "http://services1.arcgis.com/5gRznzsV72O3QAUT/arcgis/rest/services/EagleFord_07_Feature/FeatureServer/0";
            rigsUrlFeatureLayer = "http://services1.arcgis.com/5gRznzsV72O3QAUT/arcgis/rest/services/EagleFord_08/FeatureServer/0";
            var rigsFeatureLayer = new FeatureLayer(rigsUrlFeatureLayer, {
                id: "rigsFeatures",
                infoTemplate: infoTemplate,
                outFields : ["*"],
                mode: FeatureLayer.MODE_ONDEMAND // ONDEMAND, could also use FeatureLayer.MODE_ONDEMAND
            });

//            var rigsTiledLayer = new TiledLayer(rigsUrlLayer);

            soilLayerUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/Specialty/Soil_Survey_Map/MapServer";
            var tiledSoilLayer = new TiledLayer(soilLayerUrl);
            tiledSoilLayer.setOpacity(0.3);

            //add the legend
            map.on("layers-add-result", function (evt) {
                var legendDijit = new Legend({
                    map: map
                }, "legendDiv");
                legendDijit.startup();

                try {
                    toc = new TOC({
                        map: map,
                        layerInfos: [{
                            layer: rigsFeatureLayer,
                            title: "rigsFeatures",
                            slider: true // whether to display a transparency slider.
                        }, {
                            layer: tiledSoilLayer,
                            title: "Soil Map",
                            // collapsed: false, // whether this root layer should be collapsed initially, default false.
                            slider: true // whether to display a transparency slider.
                        }]
                    }, 'tocDiv');
                    toc.startup();
                } catch (e) {
                    alert(e);
                }

                var measurement = new Measurement({
                  map: map
                }, dojo.byId('measurementDiv'));
                measurement.startup();
            });

            map.addLayers([tiledSoilLayer, rigsFeatureLayer]);

            //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
            var basemapGallery = new BasemapGallery({
              showArcGISBasemaps: true,
              map: map
            }, "basemapGallery");
            basemapGallery.startup();

            var spatialSelectionStore = new Memory({
                data: [
                    {name:"Rectangle", id:"RECT"},
                    {name:"Polygon", id:"POLY"},
                    {name:"Circle", id:"CIRC"},
                    {name:"Freeform", id:"FREE"}
                ]
            });

            var spatialQueryComboBox = new ComboBox({
                id: "selectionType",
                style:{width: "100px"},
                store: spatialSelectionStore,
                searchAttr: "name"
            }, "spatialSelectionType");


});
