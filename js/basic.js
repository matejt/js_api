
require([
    "dojo/ready",
    "dojo/on",
    "dojo/parser",
    "dojo/_base/array",
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/dijit/Legend",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/AccordionContainer",
    "dijit/layout/AccordionPane"
    ], function (
        ready,
        on,
        parser,
        arrayUtils,
        Map,
        FeatureLayer,
        TiledLayer,
        Legend
        ) {
        ready(function() {

            parser.parse();

            var map = new Map("map",{
//                basemap:"topo",
                basemap:"streets",
                center:[-100,37], //long, lat
                zoom:4,
                sliderStyle:"small"
            });

            statesUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_Median_Net_Worth/MapServer/4";
            outFields = ["OBJECTID", "NAME", "MEDNW_CY", "NW1M_CY"];

            var statesFeatureLayer = new FeatureLayer(statesUrl, {
                id: "states",
                mode: 1, // ONDEMAND, could also use FeatureLayer.MODE_ONDEMAND
                outFields: outFields
            });

            statesFeatureLayer.on("load", function() {
                statesFeatureLayer.maxScale = 0; // show the states layer at all scales
                statesFeatureLayer.setSelectionSymbol(new SimpleFillSymbol().setOutline(null).setColor("#AEC7E3"));
            });

            statesFeatureLayer.setOpacity(0.5);

            soilLayerUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/Specialty/Soil_Survey_Map/MapServer";
            var tiledSoilLayer = new TiledLayer(soilLayerUrl);
            tiledSoilLayer.setOpacity(0.3);

            //add the legend
            map.on("layers-add-result", function (evt) {
                var legendDijit = new Legend({
                    map: map
                }, "legendDiv");
                legendDijit.startup();
            });

            map.addLayers([tiledSoilLayer, statesFeatureLayer]);
    });
});


