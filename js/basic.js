
require([
    "dojo/on",
    "dojo/parser",
    "agsjs/dijit/TOC",
    "dojo/_base/array",
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/dijit/Legend",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/AccordionContainer",
    "dijit/layout/AccordionPane",
    "dojox/layout/ExpandoPane",
    "dojo/domReady!"], function (
        on,
        parser,
        TOC,
        arrayUtils,
        Map,
        FeatureLayer,
        TiledLayer,
        Legend
        ) {
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

            var infoTemplate = new esri.InfoTemplate();
            infoTemplate.setTitle("Population in ${NAME}");
            infoTemplate.setContent( "<b>2007: </b>${POP2007:compare}<br/>"
                + "<b>2007 density: </b>${POP07_SQMI:compare}<br/><br/>"
                + "<b>2000: </b>${POP2000:NumberFormat}<br/>"
                + "<b>2000 density: </b>${POP00_SQMI:NumberFormat}");

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
                            layer: statesFeatureLayer,
                            title: "USA States"
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
            });

            map.addLayers([tiledSoilLayer, statesFeatureLayer]);
    });


