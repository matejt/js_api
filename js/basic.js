
require([
    "dojo/on",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/parser",
    "agsjs/dijit/TOC",
    "dojo/_base/array",
    "dojo/store/Memory",
    "dojo/data/ItemFileReadStore",
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
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/symbols/SimpleFillSymbol",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "dijit/form/FilteringSelect",
    "dijit/form/Button",
    "dojox/grid/DataGrid",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/AccordionContainer",
    "dijit/layout/AccordionPane",
    "dojox/layout/ExpandoPane",
    "dijit/TitlePane",
    "dojo/domReady!"], function (
        on,
        dom,
        domAttr,
        parser,
        TOC,
        arrayUtils,
        Memory,
        ItemFileReadStore,
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
        Draw,
        Graphic,
        SimpleFillSymbol,
        QueryTask,
        Query,
        FilteringSelect,
        Button,
        DataGrid
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
            on(map,"layers-add-result", function (evt) {
                console.log("inside map on event")
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
                    {name:"Freehand", id:"FREE"}
                ]
            });

            var spatialQueryFilteringSelect = new FilteringSelect({
                id: "selectionType",
                style:{width: "100px"},
                store: spatialSelectionStore,
                searchAttr: "name",
                onChange: activateDrawTool
            }, "spatialSelectionType");

            var drawToolbar = new Draw(map, {
                showTooltips: false,
                tooltipOffset: 20,
                drawTime: 90
            });

            function activateDrawTool(value) {
                switch (value) {
                    case "RECT":
                        drawToolbar.activate(Draw.RECTANGLE);
                        break;
                    case "POLY":
                        drawToolbar.activate(Draw.POLYGON);
                        break;
                    case "CIRC":
                        drawToolbar.activate(Draw.CIRCLE);
                        break;
                    case "FREE":
                        drawToolbar.activate(Draw.FREEHAND_POLYGON);
                        break;
                }
            }

//            drawToolbar.on("onDrawEnd", addToMap);
            on(drawToolbar, "draw-end", addToMap);

            function addToMap(evt) {
                drawToolbar.deactivate();
                var graphic = new Graphic(evt.geometry, new SimpleFillSymbol());
                map.graphics.add(graphic);

                query = new Query();
                query.returnGeometry = false;
                query.outFields = ["LocNum", "County", "WellOrient","OperatorName", "API", "PermitPublishDate"];
                query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                query.geometry = evt.geometry;
                query.where = "1=1";

                queryTask = new QueryTask(rigsUrlFeatureLayer);
                queryTask.execute(query, processResults, errCallback);
                attrPane = dom.byId("attributeQueryPane");
                domAttr.set(attrPane, open, true);

            }

            function processResults(results) {
                map.graphics.clear();
                var symbol = new esri.symbol.SimpleFillSymbol(
                    esri.symbol.SimpleFillSymbol.STYLE_NULL,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                        new dojo.Color([100,100,100]), 4), new dojo.Color([0,0,255,0.20]));

                var featureSet = results.features;

                //Create items array to be added to store's data
                var items = []; //all items to be stored in data store
                var totVals = featureSet.length;
                for (var i=0, il=featureSet.length; i<il; i++) {
                    var graphic = featureSet[i];
                    graphic.setSymbol(symbol);
                    map.graphics.add(graphic);
                    items.push(featureSet[i].attributes);
                }

                //Create data object to be used in store
                var data = {
                    identifier: "LocNum",  //This field needs to have unique values
                    label: "LocNum", //Name field for display. Not pertinent to a grid but may be used elsewhere.
                    items: items
                };

                console.log(data);

                //Create data store and bind to grid.
                store = new ItemFileReadStore({ data:data });
                grid.setStore(store);
//                hideLoading();
            }

            function errCallback(err) {
                console.log(err.message);
            }

            var buttonClearGraphics = new Button({
                label: "Clear Graphics",
                onClick: function(){
                    map.graphics.clear();                }
            }, "clearGraphicsButton");

//            dom.byId("queryPane").appendChild(buttonClearGraphics)
});
