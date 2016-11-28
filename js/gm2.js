var QueryString = function() {

    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = pair[1];
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], pair[1]];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(pair[1]);
        }
    }
    if (query_string.fullScreen !== undefined) {

        $('#navbarHeader').hide();
        $('.navbar.navbar-fixed-top').hide();
        $('.container').css('padding-top', '0');
        $('#map').css('height', '100%vt !important');
        $('#map_root').css('height', '100%');
    }

    return query_string;
}();

var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
var dojoConfig = {
    // The locationPath logic below may look confusing but all its doing is 
    // enabling us to load the api from a CDN and load local modules from the correct location.
    packages: [{
        name: "esri",
        location: '../../esri'
    }, {
        name: "application",
        location: package_path + '/js'
    }]
};

var map;
var legend;
var featureLayer;
var gsvClick, infowiClick, idfClick;
var geoGraphic;
var parcelResults, xID, symbolIdentifyPoint, symbolIdentifyPolyline, symbolIdentifyPolygon, identifyTask, identifyParameters, identifyParams, identifyValue, identifyText, searchCategorySelected, selectedParcelGeometry, measurement, showQueryResultsInt;
var app = {};
var selectionToolbar;
var streetMap, parcelLines, cityStreetParcel, aerialMap2015, aerialMap2014, aerialMap2013, aerialMap2012, aerialMap2007, aerialMap2002, aerialMap;
var layerBaseData, layerBoundaries, layerEnvironmental, layerPlace, layerStormwater, layerTransportation, layerWastewater, layerWater, visibleLayerIdsBaseData, visibleLayerIdsBoundaries, visibleLayerIdsEnvironmental, visibleLayerIdsPlace, visibleLayerIdsStormwater, visibleLayerIdsTransportation, visibleLayerIdsWastewater, visibleLayerIdsWater = [];
var opacityA;

function isInt(value) {
    return !isNaN(value) && (function(x) {
        return (x | 0) === x;
    })(parseFloat(value))
}

require(["esri/map",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/layers/ImageParameters",

    "esri/layers/DynamicLayerInfo",
    "esri/layers/LayerDataSource",
    "esri/layers/LayerDrawingOptions",
    "esri/layers/TableDataSource",
    "esri/dijit/Legend", "esri/dijit/Popup", "esri/dijit/Geocoder", "esri/dijit/HomeButton", "esri/dijit/LocateButton", "esri/geometry/Extent",

    "esri/tasks/locator", "esri/graphic", "esri/InfoTemplate", "esri/symbols/SimpleMarkerSymbol", "esri/tasks/GeometryService", "esri/SpatialReference",
    "esri/geometry/Point", "esri/geometry", "esri/request", "esri/config",
    "esri/dijit/Print", "esri/tasks/PrintTemplate", "esri/tasks/LegendLayer",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", "esri/Color",
     "esri/symbols/Font",
  "esri/symbols/TextSymbol", 
    "esri/SnappingManager", "esri/dijit/Measurement", "esri/dijit/Scalebar", "esri/toolbars/draw",
    "esri/geometry/Polyline","esri/geometry/geometryEngine",

    "dojo/dom", "dojo/dom-construct", "dojo/dom-style",
    "dojo/query", "dojo/on",
    "dojo/parser", "dojo/_base/array", "dojo/dnd/Source", "dijit/registry", "dojo/_base/connect",
    "dijit/form/Button",

    "dojo/domReady!"
], function(Map, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer, GraphicsLayer, FeatureLayer, ImageParameters, DynamicLayerInfo, LayerDataSource,
    LayerDrawingOptions, TableDataSource, Legend, Popup, Geocoder, HomeButton, LocateButton, Extent,
    Locator, Graphic, InfoTemplate, SimpleMarkerSymbol, GeometryService, SpatialReference, Point, Geometry, esriRequest, esriConfig, Print, PrintTemplate, LegendLayer,
    SimpleFillSymbol, SimpleLineSymbol, IdentifyTask, IdentifyParameters, Color, Font, TextSymbol, SnappingManager, Measurement, Scalebar, Draw, Polyline, GeometryEngine,
    dom, domConstruct, domStyle, query, on, parser, arrayUtils, Source, registry, connect) {

    parser.parse();

    parseOnLoad = "false";

    app.printUrl = "http://leia/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";

    //esriConfig.defaults.io.proxyUrl = "http://localhost/proxy/proxy.ashx";
    //esriConfig.defaults.io.alwaysUseProxy = true;
    esriConfig.defaults.geometryService = new GeometryService("http://www.gartrellgroup.net/arcgis/rest/services/Utilities/Geometry/GeometryServer");
	
    var map, usaLayer, dynamicLayerInfos;
    var infos = {};

    $.get('views/parcelTemplate.htm').then(function(template){
        app.parcelTemplate = UnderscoreTemplate(template);
    })

    var layerBaseData, layerBoundaries, layerEnvironmental, layerPlace, layerStormwater, layerTransportation, layerWastewater, layerWater, visibleLayerIds, visibleLayerIdsServices, visibleLayerIdsIncentives, visibleLayerIdsQuick = [];

    function parseLayerOptions(obj) {
        var layerOptions = {};

        if (obj.layerBaseData) {
            layerOptions.layerBaseData = obj.layerBaseData.split(',')
        }

        if (obj.layerBoundaries) {
            layerOptions.layerBoundaries = obj.layerBoundaries.split(',')
        }

        if (obj.layerEnvironmental) {
            layerOptions.layerEnvironmental = obj.layerEnvironmental.split(',')
        }

        if (obj.layerPlace) {
            layerOptions.layerPlace = obj.layerPlace.split(',')
        }

        if (obj.layerStormwater) {
            layerOptions.layerStormwater = obj.layerStormwater.split(',')
        }

        if (obj.layerTransportation) {
            layerOptions.layerTransportation = obj.layerTransportation.split(',')
        }

        if (obj.layerWater) {
            layerOptions.layerWater = obj.layerWater.split(',')
        }

        if (obj.layerWastewater) {
            layerOptions.layerWastewater = obj.layerWastewater.split(',')
        }

        return layerOptions;
    }

    if (QueryString.map !== undefined) {

        var layersRequest = esriRequest({
            url: './config/' + QueryString.map + '.js',
            handleAs: "json",
            callbackParamName: "callback"
        });
        layersRequest.then(
            function(response) {
                var options = {};
                if (response.center) options.center = response.center.split(',');
                if (response.zoom) options.zoom = Number(response.zoom);
                if (response.fullScreen === true) {
                    $('#navbarHeader').hide();
                    $('.navbar.navbar-fixed-top').hide();
                    $('.container').css('padding-top', '0');
                    $('#map').css('height', '100%vt !important');
                    $('#map_root').css('height', '100%');
                };
                if (response.ae) {
                    options.aerial = Number(response.ae);
                }
                if (response.alert !== undefined) {
                    eval.call(null, '(' + response.alertFunction + ')')();
                }
                var layerOptions = parseLayerOptions(response);

                $.extend(options, layerOptions)

                initMap(options);
            },

            function(error) {
                initMap();
                console.log("Error: ", error.message);
            });

    } else {
        var options = {};
        if (QueryString.c !== undefined) {
            options.c = QueryString.c.split(',')
        }
        if (QueryString.z != undefined) {
            options.zoom = Number(QueryString.z);
        }
        if (QueryString.ae) {
            options.aerial = QueryString.ae.split(',');
        }
        var layerOptions = parseLayerOptions(QueryString);

        $.extend(options, layerOptions);

        initMap(options);
    }

    function initMap(options) {

        options = options || {};
        
        options.layerBaseData = options.layerBaseData || [];
        options.layerBoundaries = options.layerBoundaries || [];
        options.layerPlace = options.layerPlace || [];
        options.layerEnvironmental = options.layerEnvironmental || [];
        options.layerStormwater = options.layerStormwater || [];
        options.layerTransportation = options.layerTransportation || [];
        options.layerWastewater = options.layerWastewater || [];
        options.layerWater = options.layerWater || [];
        
        var map_options = {
            autoResize: false
        }
        
        if (options.c !== undefined) {
            map_options.center = new Point(options.c, new SpatialReference({
                wkid: 2913
            }));

            if (options.zoom !== undefined) {
                map_options.zoom = options.zoom;
            }

        } else if (options.zoom !== undefined) {
            map_options.zoom = options.zoom;
            map_options.center = new Point(7708641.208200004, 677288.6098999954, new SpatialReference({
                wkid: 2913
            }));
        } else { 
            map_options.extent = new Extent({
                xmin: 7682478.588,
                ymin: 652441.696,
                xmax: 7733270.492,
                ymax: 704402.195,
                spatialReference: {
                    wkid: 2913
                }
            })
        }

        app.map = new Map('map',
            map_options
        );

        var home = new HomeButton({
            map: app.map
        }, "HomeButton");
        home.startup();

        var scalebar = new Scalebar({
            map: app.map,
            attachTo: "bottom-left",
            scalebarUnit: "dual"
        });

        // streetMap = new ArcGISTiledMapServiceLayer("http://leia/arcgis/rest/services/gview/BaseMap/MapServer");
        streetMap = new esri.layers.ArcGISTiledMapServiceLayer('http://maps.greshamoregon.gov/arcgis/rest/services/gview/BaseMap/MapServer')
        // parcelLines = new esri.layers.ArcGISTiledMapServiceLayer("http://leia/arcgis/rest/services/gview/ParcelLines/MapServer");
        // cityStreetParcel = new esri.layers.ArcGISDynamicMapServiceLayer("http://leia/arcgis/rest/services/gview/CityStreetParcel/MapServer");
        aerialMap2015 = new esri.layers.ArcGISTiledMapServiceLayer("http://maps.greshamoregon.gov/arcgis/rest/services/gview/AerialCacheNew/MapServer");
        // aerialMap2014 = new esri.layers.ArcGISTiledMapServiceLayer("http://leia/arcgis/rest/services/gview/AerialCache/MapServer");
        aerialMap2013 = new esri.layers.ArcGISTiledMapServiceLayer("http://maps.greshamoregon.gov/arcgis/rest/services/gview/AerialCacheOld/MapServer");
        aerialMap2012 = new esri.layers.ArcGISTiledMapServiceLayer("http://maps.greshamoregon.gov/arcgis/rest/services/gview/AerialCache12/MapServer");
        aerialMap2007 = new esri.layers.ArcGISImageServiceLayer("http://www3.multco.us/arcgispublic/rest/services/Imagery/Urban_2007/ImageServer");
        aerialMap2002 = new esri.layers.ArcGISImageServiceLayer("http://www3.multco.us/arcgispublic/rest/services/Imagery/Urban_2002/ImageServer");

        if (options.aerial) {
            
            app.map.removeAllLayers();
            var aerialYear;
            switch (parseInt(options.aerial[0])) {
                case 2015:
                    aerialYear = aerialMap2015;
                    break;
                case 2014:
                    aerialYear = aerialMap2014;
                    break;
                case 2013:
                    aerialYear = aerialMap2013;
                    break;
                case 2012:
                    aerialYear = aerialMap2012;
                    break;
                case 2007:
                    aerialYear = aerialMap2007;
                    break;
                case 2002:
                    aerialYear = aerialMap2002;
                    break;
            }
            var selectedRadioID = "#" + "aerialR" + options.aerial[0];
            $(selectedRadioID).prop("checked", true);
            var aerialOpacity = options.aerial[1];
            // app.map.addLayers([streetMap, aerialYear, parcelLines, layerBaseData, layerBoundaries, layerEnvironmental, layerPlace, layerStormwater, layerTransportation, layerWastewater, layerWater]);
            app.map.addLayers([streetMap]);
            aerialYear.setOpacity(aerialOpacity);
            $('#slider-aerial').val(aerialOpacity).slider("refresh");
        } else {
            aerialMap2015.setOpacity(0);
        }
		
        //for infowindow only shows up on the right panel
        app.map.infoWindow.set("popupWindow", false);

        //for whatever reason the map doesn't work correctly when we pass any layer options into the constructor
        //so we have to come back after the fact and adjust the legend... e.g Line 370-450

        function createImageParams(layer, url, id){
            var imageParameters = new ImageParameters();
            imageParameters.layerIds = [];
            imageParameters.layerOption = imageParameters.LAYER_OPTION_SHOW;

            layer = new ArcGISDynamicMapServiceLayer(url, {
                "imageParameters": imageParameters,
                "opacity": 0.8,
                "id": id
            })
        }

        createImageParams(layerBaseData, "http://leia/arcgis/rest/services/gview2/BaseData/MapServer", 'layerBaseData');
        createImageParams(layerBoundaries, "http://leia/arcgis/rest/services/gview2/Boundaries/MapServer", 'layerBoundaries');
        createImageParams(layerEnvironmental, "http://leia/arcgis/rest/services/gview2/Environmental/MapServer", 'layerEnvironmental');
        createImageParams(layerPlace, "http://leia/arcgis/rest/services/gview2/Place/MapServer", 'layerPlace');
        createImageParams(layerStormwater, "http://leia/arcgis/rest/services/gview2/StormWater/MapServer", 'layerStormwater');
        createImageParams(layerTransportation, "http://leia/arcgis/rest/services/gview2/Transportation/MapServer", 'layerTransportation');
        createImageParams(layerWastewater, "http://leia/arcgis/rest/services/gview2/WasteWater/MapServer", 'layerWastewater');
        createImageParams(layerWater, "http://leia/arcgis/rest/services/gview2/Water/MapServer", 'layerWater');

        app.map.addLayers([streetMap, parcelLines, layerBaseData, layerBoundaries, layerEnvironmental, layerPlace, layerStormwater, layerTransportation, layerWastewater, layerWater]);

        //Legend
        legend = new Legend({
            map: app.map,
            respectCurrentMapScale: true,
            layerInfos: [{
                layer: layerBaseData
            }, {
                layer: layerBoundaries
            }, {
                layer: layerEnvironmental
            }, {
                layer: layerPlace
            }, {
                layer: layerStormwater
            }, {
                layer: layerTransportation
            }, {
                layer: layerWastewater
            }, {
                layer: layerWater
            }]
        }, "legendDiv");
		
        function handleLayerOptions(layer,options, sliderNumber, selector){

            var opt = Number(options.splice(options.length - 1, 1)[0])

            if(opt){
                layer.setOpacity(opt);
                $("#slider-"+sliderNumber).val(opt).slider('refresh');
                layer.setVisibleLayers(options);
            }

            options.forEach(function(v){
                $('#'+selector+v+'CheckBox').prop('checked', true).attr('data-cacheval', false).prev().removeClass('ui-checkbox-off').addClass('ui-checkbox-on');
            });
        }

        handleLayerOptions(layerBaseData, options.layerBaseData, 1, 'basedata');
        handleLayerOptions(layerBoundaries, options.layerBoundaries, 1, 'boundaries');
        handleLayerOptions(layerEnvironmental, options.layerEnvironmental, 1, 'environmental');
        handleLayerOptions(layerPlace, options.layerPlace, 1, 'place');
        handleLayerOptions(layerStormwater, options.layerStormwater, 1, 'stormwater');
        handleLayerOptions(layerTransportation, options.layerTransportation, 1, 'transportation');
        handleLayerOptions(layerWastewater, options.layerWastewater, 1, 'wasteWater');
        handleLayerOptions(layerWater, options.layerWater, 1, 'water');

        //To set max-height of right panel
        var heightLegend = parseInt($(window).height()) - 50 - 43;
        heightLegend = heightLegend + "px";
        $('#rightPanel .tab-content').css('height', heightLegend);
        //End to set max-height of right panel

		legend.refresh([{
            layer: layerBaseData
        }]);
		
        //End of Legend

        //Define Queries
        queryTaskPa = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/EastCountyParcels/MapServer/0");
        queryPa = new esri.tasks.Query({returnGeometry:true, outFields:['*']});

        // //define queries
        queryTaskA = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/AddressPts/MapServer/1");
        queryA = new esri.tasks.Query({returnGeometry:true, outFields:['*']});

        //End of Define Queries

        //Info Window
        mapClickEvent = on(app.map, "click", function(evt) {
            showLocation(evt);
        });

        /*
        ____ ____ ____ ____ _    ____    ____ ___ ____ ____ ____ ___    _  _ _ ____ _ _ _ 
        | __ |  | |  | | __ |    |___    [__   |  |__/ |___ |___  |     |  | | |___ | | | 
        |__] |__| |__| |__] |___ |___    ___]  |  |  \ |___ |___  |      \/  | |___ |_|_|
        */
                                                                                  
        var target = dojo.byId("btnGoogle");
        on(target, "click", function(evt) {
            if (dojo.byId("map_layers").style.cursor != "default") {
                dojo.byId("btnGoogle").src = "images/streetview18x20.png";
                dojo.byId("map_layers").style.cursor = "default";
                mapClickEvent.remove();
                dojo.disconnect(mapClickEvent);
                mapClickEvent = on(app.map, "click", function(evt) {
                    showLocation(evt);
                });
                dojo.disconnect(gsvClick);
            } else {
                dojo.byId("btnGoogle").src = "images/streetview_exitover18x20.png";
                dojo.byId("map_layers").style.cursor = "url('images/gsv_cursor3.cur'),crosshair";
                //disengage identify tool
                dojo.disconnect(idfClick);
                dojo.byId("btnIdentify").innerHTML = "Identify: none";
                app.map.graphics.clear();
                dojo.addClass("btnIdentify", "btn-default");
                dojo.removeClass("btnIdentify", "btn-info");
                dojo.addClass("btnIdentifyS", "btn-default");
                dojo.removeClass("btnIdentifyS", "btn-info");
                //disengage measurement tool
                measurement.hide();
                measurement.clearResult();
                measurement.setTool("area", false);
                measurement.setTool("distance", false);
                measurement.setTool("location", false);
                mapClickEvent.remove();
                dojo.disconnect(mapClickEvent);

                gsvClick = dojo.connect(app.map, 'onClick', function(evt) {

                    var gs = new esri.tasks.GeometryService("http://www.gartrellgroup.net/arcgis/rest/services/Utilities/Geometry/GeometryServer");
                    var outSR = new SpatialReference(4326);

                    var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
                        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                            new dojo.Color([90, 164, 65, 0.5]), 8),
                        new dojo.Color([90, 164, 65, 0.9])
                    );
                    var graphic = new Graphic(evt.mapPoint, symbol);
                    app.map.graphics.clear();
                    app.map.graphics.add(graphic);

                    gs.project([evt.mapPoint], outSR, function(projectedPoints) {
                        var pt = projectedPoints[0];
                        var gsvUrl = "http://maps.greshamoregon.gov/gview/streetview.html?lat=" + pt.y + "&lng=" + pt.x;
                        window.open(gsvUrl, window, "width=615px, height=440px, scrollbar=no, resizable=no, titlebar=no");
                    });
                });
            }
        });

        $("#streetViewLink").click(function() {
            if ($('#btnGoogle').is(':visible')) {
                $('#btnGoogle').hide("fast", "swing");
                dojo.disconnect(gsvClick);
                dojo.byId("map_layers").style.cursor = "default";
                dojo.byId("btnGoogle").src = "images/streetview18x20.png";
				mapClickEvent.remove();
				dojo.disconnect(mapClickEvent);
                mapClickEvent = on(app.map, "click", function(evt) {
                    showLocation(evt);
                });
            } else {
                $('#btnGoogle').show("fast", "swing");
                $('#print_button').hide();
                $('#myText').hide();
                $('#btnIdentify').hide();
                dojo.disconnect(idfClick);
                $('#measurementDiv').hide();
                //disengage parcel identify tool
                mapClickEvent.remove();
                dojo.disconnect(mapClickEvent);
            }
        });
       
        function initSelectToolbar(event) {
            selectionToolbar = new Draw(event.app.map);
            on(selectionToolbar, "DrawEnd", function(geometry) {
                selectionToolbar.deactivate();
                alert("selection Done");
            })
        }

        /*
        _ ___  ____ _  _ ___ _ ____ _   _ 
        | |  \ |___ |\ |  |  | |___  \_/  
        | |__/ |___ | \|  |  | |      |   
                                  
        */

        var target = dojo.byId("btnIdentify");
        on(target, "click", function(evt) {
            if (dojo.byId("map_layers").style.cursor == "help" && identifyValue == xID) {
                dojo.byId("btnIdentify").innerHTML = "Identify: none";
                dojo.addClass("btnIdentify", "btn-default");
                dojo.removeClass("btnIdentify", "btn-info");
                dojo.addClass("btnIdentifyS", "btn-default");
                dojo.removeClass("btnIdentifyS", "btn-info");
                dojo.byId("map_layers").style.cursor = "default";
				mapClickEvent.remove();
				dojo.disconnect(mapClickEvent);
                mapClickEvent = on(app.map, "click", function(evt) {
                    showLocation(evt);
                });
                dojo.disconnect(idfClick);
                app.map.graphics.clear();
            } else {
				dojo.disconnect(idfClick);
                if (identifyText) dojo.byId("btnIdentify").innerHTML = "Identify: " + identifyText;
                else {
                    dojo.byId("btnIdentify").innerHTML = "Identify: Hauler";
                    identifyValue = 16;
                }
                dojo.removeClass("btnIdentify", "btn-default");
                dojo.addClass("btnIdentify", "btn-info");
                dojo.removeClass("btnIdentifyS", "btn-default");
                dojo.addClass("btnIdentifyS", "btn-info");
                //disengage google street view tool
                dojo.disconnect(gsvClick);
                dojo.byId("btnGoogle").src = "images/streetview18x20.png";
                //disengage measurement tool
                measurement.hide();
                measurement.clearResult();
                measurement.setTool("area", false);
                measurement.setTool("distance", false);
                measurement.setTool("location", false);
                dojo.byId("map_layers").style.cursor = "help";
                mapClickEvent.remove();
                dojo.disconnect(mapClickEvent);

                if (identifyValue) xID = identifyValue;
                else xID = 16;

                // idfClick = dojo.connect(app.map, 'onClick', function(evt) {

                //     identifyTask = new IdentifyTask("http://leia/arcgis/rest/services/gview2/GVII/MapServer");

                //     identifyParams = new IdentifyParameters();
                //     identifyParams.tolerance = 3;
                //     identifyParams.returnGeometry = true;
                //     identifyParams.layerIds = [xID];
                //     identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
                //     identifyParams.width = app.map.width;
                //     identifyParams.height = app.map.height;

                //     app.map.graphics.clear();
                //     identifyParams.geometry = evt.mapPoint; 
                //     identifyParams.mapExtent = app.map.extent;
                //     identifyTask.execute(identifyParams, function(idResults) {
                //         addToMap(idResults, evt);
                //     });

                //     symbolIdentifyPoint = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_DIAMOND, 20,
                //         new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                //             new Color([255, 0, 0]), 2),
                //         new Color([0, 255, 0, 0.75])
                //     );
                //     symbolIdentifyPolyline = new SimpleLineSymbol(
                //         SimpleLineSymbol.STYLE_SOLID,
                //         new Color([255, 0, 0]),
                //         7
                //     );
                //     symbolIdentifyPolygon = new SimpleFillSymbol(
                //         SimpleFillSymbol.STYLE_SOLID,
                //         new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2),
                //         new Color([255, 255, 0, 0.25])
                //     );
                // });



            }
        });

        function addToMap(idResults, event) {

            parcelResults = {
                displayFieldName: null,
                features: [],
                layerName: null
            };
            for (var i = 0, il = idResults.length; i < il; i++) {
                var idResult = idResults[i];

                parcelResults.displayFieldName = idResult.displayFieldName;
                parcelResults.layerName = idResult.layerName;
                parcelResults.features.push(idResult.feature);
            }
            layerTabContent(parcelResults);
        }

        function layerTabContent(layerResults) {
            //create a new array of field names from the results returned by identify
            var featAttrs = layerResults.features[0].attributes;
            var attrNames = [];
            for (var i in featAttrs) {
                attrNames.push(i);
            }
            var content = "";
            content = "<i><b>" + layerResults.layerName + "</b> features returned: " + layerResults.features.length + "</i>";
            //start building the infowindow content as an html table
            content += "<table id='idfTable' border='1' style='margin:10px;'><tr>";
            dojo.forEach(attrNames, function(a) {
                //add each field name as a table column title
                content += "<th style='padding:6px;'>" + a + "</th>";
            });
            content += "</tr>"; //end of header row in the table
            dojo.forEach(layerResults.features, function(f) {
                var line2 = 0;
                var mainID;
                var nName;
                content += "<tr>" //create a new row for each feature
                dojo.forEach(attrNames, function(an) {
                    //assign main id for utilities report
                    if (layerResults.layerName == "Public_Lines" && line2 == 13) {
                        mainID = f.attributes[an];
                    }
                    if (layerResults.layerName == "Mains" && line2 == 1) {
                        mainID = f.attributes[an];
                    }
                    if (layerResults.layerName == "Water Mains" && line2 == 1) {
                        mainID = f.attributes[an];
                    }
                    if (layerResults.layerName == "Neighborhood" && line2 == 1) {
                        nName = f.attributes[an];
                        if (f.attributes[an] == "MT. HOOD") {
                            content += "<td style='padding:6px;'><a href='https://greshamoregon.gov/MOUNT-HOOD-Neighborhood-Association/' target='_blank'>" + nName + "</a></td>";
                        } else {
                            var nNameDash = nName.replace(/\s+/g, '-').toUpperCase();
                            content += "<td style='padding:6px;'><a href='https://greshamoregon.gov/" + nNameDash + "-Neighborhood-Association/' target='_blank'>" + nName + "</a></td>";
                        }
                    }

                    //add the value for each attribute as a table cell
                    if (f.attributes[an].substring(0, 4) == "http") {
                        content += "<td style='padding:6px;'><a href='" + f.attributes[an] + "''>" + f.attributes[an] + "</a></td>";
                    } else if (f.attributes[an].substring(2, 13) == "Gresham.gov") {
                        content += "<td style='padding:6px;'><a href='" + f.attributes[an] + "''>" + f.attributes[an] + "</a></td>";
                    } else if (f.attributes[an].split(".")[1] == "tif" || f.attributes[an].split(".")[1] == "pdf" || f.attributes[an].split(".")[1] == "TIF" || f.attributes[an].split(".")[2] == "tif" || f.attributes[an].split(".")[2] == "pdf" || f.attributes[an].split(".")[2] == "TIF") {
                        if (layerResults.layerName == "Public_Lines") {
                            content += "<td style='padding:6px;'><a href='http://leia/utilitiesreport/stormreport.html?ID=" + mainID + "' target='_blank'>StormWater Report</a></td>";
                        } else if (layerResults.layerName == "Mains" && line2 == 17) {
                            content += "<td style='padding:6px;'><a href='http://leia/utilitiesreport/sewerreport.html?ID=" + mainID + "' target='_blank'>WasteWater Report</a></td>";
                        } else if (layerResults.layerName == "Water Mains" && line2 == 22) {
                            content += "<td style='padding:6px;'><a href='http://leia/utilitiesreport/waterreport.html?ID=" + mainID + "' target='_blank'>Water Report</a></td>";
                        } else {
                            content += "<td style='padding:6px;'><a href='file:///" + f.attributes[an] + "' target='_blank'>" + f.attributes[an] + "</a></td>";
                        }
                    } else {
                        content += "<td style='padding:6px;'>" + f.attributes[an] + "</td>";
                    }
                    line2 += 1;
                });
                content += "</tr>"; //end of a row of attributes for a feature
                showFeature(f);
            });
            content += "</table>";

            var x = window.open("", window, "width=850px, height=200px, scrollbars=yes, resizable=yes, titlebar=no");
            x.document.open();
            x.document.write(content);

            return content;
        }

        function showFeature(feature) {
            app.map.graphics.clear();
            if (feature.geometry.type == "point") {
                feature.setSymbol(symbolIdentifyPoint);
            } else if (feature.geometry.type == "polyline") {
                feature.setSymbol(symbolIdentifyPolyline);
            } else if (feature.geometry.type == "polygon") {
                feature.setSymbol(symbolIdentifyPolygon);
            }
            app.map.graphics.add(feature);
        }

        $(".identifyDropdownList.dropdown-menu li a").click(function() {
            identifyValue = $(this).data('value');
            identifyText = $(this).text();
            $("#btnIdentify").trigger("click");
        });

        $("#identifyLink").click(function() {
            if ($('#myText').is(':visible')) {
                $('#myText').hide("fast", "swing");
                $('#btnIdentify').hide("fast", "swing");
                dojo.disconnect(idfClick);
                dojo.byId("map_layers").style.cursor = "default";
				mapClickEvent.remove();
				dojo.disconnect(mapClickEvent);
                mapClickEvent = on(app.map, "click", function(evt) {
                    showLocation(evt);
                });
            } else {
                $('#myText').show("fast", "swing");
                $('#btnIdentify').show("fast", "swing");
                $('#print_button').hide();
                $('#measurementDiv').hide();
                $('#btnGoogle').hide();
                dojo.disconnect(gsvClick);
                mapClickEvent.remove();
                dojo.disconnect(mapClickEvent);
                //disengage parcel identify tool
                dojo.byId("btnIdentify").innerHTML = "Identify: none";
                dojo.addClass("btnIdentify", "btn-default");
                dojo.removeClass("btnIdentify", "btn-info");
                dojo.addClass("btnIdentifyS", "btn-default");
                dojo.removeClass("btnIdentifyS", "btn-info");
            }
        });
    
        /*
        _  _ ____ ____ ____ _  _ ____ ____ _  _ ____ _  _ ___ 
        |\/| |___ |__| [__  |  | |__/ |___ |\/| |___ |\ |  |  
        |  | |___ |  | ___] |__| |  \ |___ |  | |___ | \|  |  
                                                      
        */

        measurement = new Measurement({
            map: app.map,
            defaultLengthUnit: "esriFeet",
            defaultAreaUnit: "esriSquareFeet"
        }, dom.byId("measurementDiv"));
        measurement.startup();

        var mapMeasureEvent, lastPoint;
        var textSymbols = [];

        measurement.on("measure-start", function(evt) {
            //disable identify click
            if(textSymbols.length>0){
                textSymbols.forEach(function(g){
                    app.map.graphics.remove(g);
                })
                textSymbols = [];
            }
            dojo.byId("btnIdentify").innerHTML = "Identify: none";
            dojo.addClass("btnIdentify", "btn-default");
            dojo.removeClass("btnIdentify", "btn-info");
            dojo.addClass("btnIdentifyS", "btn-default");
            dojo.removeClass("btnIdentifyS", "btn-info");
            dojo.disconnect(idfClick);
            //disable google click
            dojo.byId("btnGoogle").src = "images/streetview18x20.png";
            dojo.byId("map_layers").style.cursor = "default";
            dojo.disconnect(gsvClick);
            mapClickEvent.remove();
            dojo.disconnect(mapClickEvent);
            dojo.disconnect(mapMeasureEvent);
            var point = measurement._currentStartPt;

            lastPoint = point;
            mapMeasureEvent = on(app.map, "mouse-move", function(evt){

                var line = new Polyline(app.map.spatialReference);
                
                line.addPath([point,evt.mapPoint]);
                var unit = measurement.getUnit();
                length = GeometryEngine.planarLength(line, unit.toLowerCase());
                $('#dijit_layout_ContentPane_3').html((length).toFixed(2) + ' ' + unit.toLowerCase())
            });
        });

        measurement.on('measure-end', function(evt){
            dojo.disconnect(mapMeasureEvent);
            $('#floatingMeasurePanel').hide();
        })

        measurement.on("measure", function(evt) {

            dojo.disconnect(idfClick);
            dojo.disconnect(gsvClick);
            mapClickEvent.remove();
            dojo.disconnect(mapClickEvent);
            dojo.disconnect(mapMeasureEvent);
            var point = evt.geometry;
            curLength = evt.values;
            var unit = measurement.getUnit();

            mapMeasureEvent = on(app.map, "mouse-move", function(evt){
                var line = new Polyline(app.map.spatialReference);
                line.addPath([point,evt.mapPoint]);
                
                length = GeometryEngine.planarLength(line, unit.toLowerCase());
                $('#dijit_layout_ContentPane_3').html((curLength+length).toFixed(2) + ' ' + unit.toLowerCase())
                $('#floatingMeasurePanel').css({'top':evt.clientY-30, 'left':evt.clientX+20}).html((curLength+length).toFixed(2) + ' ' + unit.toLowerCase());
            });

            var line = new Polyline(app.map.spatialReference);
            line.addPath([point,lastPoint]);
            lastPoint = point;
                
            length = GeometryEngine.planarLength(line, unit.toLowerCase());

            var font = new Font("16px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLDER, 'Arial, sans-serif');
            var t = new TextSymbol((length).toFixed(2) + ' ' + unit.toLowerCase(), font, new Color([0, 0, 0]));

            t.setOffset(20, 30);
            //console.log(t)
            var g2 = new Graphic(point, t);
            textSymbols.push(g2);
            app.map.graphics.add(g2);
            $('#floatingMeasurePanel').css({'top':evt.clientY-30, 'left':evt.clientX+20})
            $('#floatingMeasurePanel').show();

        });

        $("#measureLink").click(function() {
            if ($('#measurementDiv').is(':visible')) {
                $('#measurementDiv').hide("fast", "swing");
                mapClickEvent = on(app.map, "click", function(evt) {
                    showLocation(evt);
                });
            } else {
				  mapClickEvent.remove();
				  dojo.disconnect(mapClickEvent);
				  mapClickEvent.remove();
				  dojo.disconnect(mapClickEvent);
				  mapClickEvent.remove();
				  dojo.disconnect(mapClickEvent);
				  app.map.graphics.clear();
				  $('#measurementDiv').show("fast", "swing");
				  dojo.disconnect(idfClick);
				  dojo.disconnect(gsvClick);
				  dojo.byId("btnGoogle").src = "images/streetview18x20.png";
				  dojo.byId("map_layers").style.cursor = "default"; 
				  $('#print_button').hide();
				  $('#myText').hide();
				  $('#btnIdentify').hide();
				  $('#btnGoogle').hide();
            }
        });

        /*
        _    ____ ____ ____ _  _ ___  
        |    |___ | __ |___ |\ | |  \ 
        |___ |___ |__] |___ | \| |__/ 

        */
                              
        function refreshLegend(){
            legend.refresh([{
                layer: layerBaseData
            }, {
                layer: layerBoundaries
            }, {
                layer: layerEnvironmental
            }, {
                layer: layerPlace
            }, {
                layer: layerStormwater
            }, {
                layer: layerTransportation
            }, {
                layer: layerWastewater
            }, {
                layer: layerWater
            }]);
        }

        //layer opacity handler
        $(".layer-slider").on("change", function() {
            
            var opacity = $(this).val();

            switch($(this).attr('id')) {

                case 'slider-1':
                    layerTransportation.setOpacity(opacity);
                    break;
                case 'slider-2':
                    layerBoundaries.setOpacity(opacity);
                    break;
                case 'slider-3':
                    layerEnvironmental.setOpacity(opacity);
                    break;
                case 'slider-4':
                    layerPlace.setOpacity(opacity);
                    break;
                case 'slider-5':
                    layerStormwater.setOpacity(opacity);
                    break;
                case 'slider-6':
                    layerTransportation.setOpacity(opacity);
                    break;
                case 'slider-7':
                    layerWastewater.setOpacity(opacity);
                    break;
                case 'slider-8':
                    layerWater.setOpacity(opacity);
                    break;
            }

            refreshLegend();
        });

        //Aerial opacity handler
        $("#slider-aerial").on("change", function() {
            opacityA = $("#slider-aerial").val();
            var aerialSelection = $('input[name="aerialSelect"]:checked').val();
            if (aerialSelection === '2014') aerialMap2014.setOpacity(opacityA);
            else if (aerialSelection === '2013') aerialMap2013.setOpacity(opacityA);
            else if (aerialSelection === '2012') aerialMap2012.setOpacity(opacityA);
            else if (aerialSelection === '2015') aerialMap2015.setOpacity(opacityA);
            else if (aerialSelection === '2007') aerialMap2007.setOpacity(opacityA);
            else if (aerialSelection === '2002') aerialMap2002.setOpacity(opacityA);
        });

        //Use the ImageParameters to set the visibleLayerIds layers in the map service during ArcGISDynamicMapServiceLayer construction.

        $('.toc-item').on('click', function(){

            var list_number = $(this).attr('class').replace('toc-item','').trim();

            visibleLayerIds = [];

            query(list_number).forEach(function(layer){
                if(layer.checked){

                    //special handling for environmnental layer
                    if (layer.value === '9,10,11') {
                        visibleLayerIds.push(9);
                        visibleLayerIds.push(10);
                        visibleLayerIds.push(11);
                    } else {
                        visibleLayerIds.push(layer.value);
                    }
                }
            })

            if (visibleLayerIds.length === 0) {
                visibleLayerIds.push(-1);
            }

            var layer;

            switch(list_number){

                case 'list_item1':
                    layer = layerBaseData;
                    break;
                case 'list_item2':
                    layer = layerBoundaries;
                    break;
                case 'list_item3':
                    layer = layerEnvironmental;
                    break;
                case 'list_item4':
                    layer = layerPlace;
                    break;
                case 'list_item5':
                    layer = layerStormwater;
                    break;
                case 'list_item6':
                    layer = layerTransportation;
                    break;
                case 'list_item7':
                    layer = layerWastewater;
                    break;
                case 'list_item8':
                    layer = layerWater
                    break;
            }

            var opacityIndex = list_number.replace('list_item','');
            var opacity = $("#slider-"+opacityIndex).val();

            layer.setVisibleLayers(visibleLayerIds);
            app.map.addLayer(layer);
            refreshLegend();
        })

        //Delete all layers function
        $("#btnDeleteAll").on("click", function() {
            
            layerBaseData.setVisibleLayers([]);
            layerBoundaries.setVisibleLayers([]);
            layerEnvironmental.setVisibleLayers([]);
            layerPlace.setVisibleLayers([]);
            layerStormwater.setVisibleLayers([]);
            layerTransportation.setVisibleLayers([]);
            layerWastewater.setVisibleLayers([]);
            layerWater.setVisibleLayers([]);

            refreshLegend();

            $('div.panel-body input[type="checkbox"]').removeAttr("checked");
            if ($("div.ui-checkbox label.ui-btn-icon-left").hasClass("ui-checkbox-on")) {
                $("div.ui-checkbox label.ui-btn-icon-left").removeClass("ui-checkbox-on");
                $("div.ui-checkbox label.ui-btn-icon-left").addClass("ui-checkbox-off");
            }

            $("#slider-1,#slider-2,#slider-3,#slider-4,#slider-5,#slider-6,#slider-7,#slider-8").val(0.5);
            $("#slider-1,#slider-2,#slider-3,#slider-4,#slider-5,#slider-6,#slider-7,#slider-8").slider('refresh');
        });
        //End of Delete all layers function

        //delete all selections and drawings
        $("#btnDeleteSelection").on("click", function() {
            app.map.graphics.clear();
        });

        /*
        ____ ____ ____ ____ ____ ___  ____ 
        | __ |___ |  | |    |  | |  \ |___ 
        |__] |___ |__| |___ |__| |__/ |___ 

        */
                                   
        //Geocode Search 
        var geocoder;
        var locatorUrl = "http://leia/arcgis/rest/services/Tools/StreetAddressLocator/GeocodeServer";
        locatorUrl = 'http://maps.greshamoregon.gov/arcgis/rest/services/Tools/COG_Address_SingleHouseType/GeocodeServer';

        // add a graphics layer for geocoding results
        app.map.addLayer(new esri.layers.GraphicsLayer({
            id: "results"
        }));

        var myGeocoders = [{
            url: locatorUrl,
            singleLineFieldName: "Single Line Input",
            placeholder: "Type an address or a Parcel ID (RNO or PropID)"
        }];

        geocoder = new Geocoder({
            map: app.map,
            autoComplete: false,
            arcgisGeocoder: false,
            geocoders: myGeocoders,
            zoomScale: 1800
        }, "iptTypeGeo");

        var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
            new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                new dojo.Color([210, 105, 30, 0.5]), 8),
            new dojo.Color([210, 105, 30, 0.9])
        );

        var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 3), new Color([255, 255, 0]));


        function pointAnimate() {
            $("circle").css("opacity", 1);
            $("circle").animate({
                opacity: 0.1
            }, 3000, pointAnimate);
        }

        function showLocation(evt) {

            if(!evt.ctrlKey){
                app.map.graphics.clear();
            }

            if (evt.result) {
                var point = evt.result.feature.geometry;
            } else {
                var point = evt.mapPoint;
            }

            var graphic = new Graphic(point, symbol);
            app.map.graphics.add(graphic);
            pointAnimate();

            //create a new query and querytask to populate Search Results tab
            var infoContentRC = "";

            //Census info
            var censusTractNo;
            queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
            queryC = new esri.tasks.Query()
            queryC.returnGeometry = true;
            queryC.outFields = ["*"];
            queryC.geometry = point;
            queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
            queryTaskC.execute(queryC, function(resultsC) {
                if (resultsC.features.length === 1) {
                    var graphicC = resultsC.features[0];
                    var attrC = graphicC.attributes;
                    censusTractNo = attrC.TRACT;

                    //End of Census info

                    queryTaskP = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/EastCountyParcels/MapServer/0");
                    queryP = new esri.tasks.Query();
                    queryP.returnGeometry = true;
                    queryP.outFields = ["*"];

                    queryP.geometry = point;
                    queryP.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                    queryTaskP.execute(queryP, function(resultsP) {
                        if (resultsP.features.length < 1) {
                            infoContentRC = "<b>No records found.</b>";
                        } else if (resultsP.features.length > 1) {
                            infoContentRC = "<b>More than two records found.</b>";
                        } else {
                            for (var i = 0; i < resultsP.features.length; i++) {
                                var graphic = resultsP.features[i];

                                var graphicSymbol = new Graphic(graphic.geometry, highlightSymbol);
                                app.map.graphics.add(graphicSymbol);
                                var attr = graphic.attributes;
                                var stateIDfirst = attr.STATEID.split(" ")[0];
                                attr.newState_ID = "<a href='http://www4.multco.us/surveyimages/dist/assr/out/" + stateIDfirst + ".pdf' onclick='window.open(this.href," + '"' + "window" + '"' + ',' + '"' + 'resizable,scrollbars,titlebar=no' + '"' + ");return false;'>Link</a>";
                                attr.censusTractNo=censusTractNo;
                                attr.newRNO = attr.RNO.replace("R", "");
                                var contentRC = app.parcelTemplate({attr:attr});
                                
                                infoContentRC += contentRC;
                            }
                        }
                        dom.byId("featureCount").innerHTML = "";
                        dom.byId("leftPane").innerHTML = infoContentRC;
                    });
                }
            });
            if (app.map.getZoom() < 7) {
                app.map.centerAndZoom(point, 7);
            } else {
                app.map.centerAt(point);
            }
            openRightPanelSTab();
        }
        //End of Geocode Search


        //Print
        //get print templates from the export web map task
        var printInfo = esriRequest({
            "url": app.printUrl,
            "content": {
                "f": "json"
            }
        });
        printInfo.then(handlePrintInfo, handleError);

        function handlePrintInfo(resp) {
            var layoutTemplate, templateNames, mapOnlyIndex, templates;

            layoutTemplate = arrayUtils.filter(resp.parameters, function(param, idx) {
                return param.name === "Layout_Template";
            });

            if (layoutTemplate.length === 0) {
                return;
            }
            templateNames = layoutTemplate[0].choiceList;

            // remove the MAP_ONLY template then add it to the end of the list of templates 
            mapOnlyIndex = arrayUtils.indexOf(templateNames, "MAP_ONLY");
            if (mapOnlyIndex > -1) {
                var mapOnly = templateNames.splice(mapOnlyIndex, mapOnlyIndex + 1)[0];
                templateNames.push(mapOnly);
            }

            //create legend items for the print legend layers options
            var Legend1 = new LegendLayer();
            Legend1.layerId = "layerBaseData";
            var Legend2 = new LegendLayer();
            Legend2.layerId = "layerBoundaries";
            var Legend3 = new LegendLayer();
            Legend3.layerId = "layerEnvironmental";
            var Legend4 = new LegendLayer();
            Legend4.layerId = "layerPlace";
            var Legend5 = new LegendLayer();
            Legend5.layerId = "layerStormwater";
            var Legend6 = new LegendLayer();
            Legend6.layerId = "layerTransportation";
            var Legend7 = new LegendLayer();
            Legend7.layerId = "layerWastewater";
            var Legend8 = new LegendLayer();
            Legend8.layerId = "layerWater";

            var printTitle = $("#printInput").val();

            // create a print template for each choice
            templates = arrayUtils.map(templateNames, function(ch) {
                var plate = new PrintTemplate();
                plate.layout = plate.label = ch;
                plate.format = "PDF";
                plate.layoutOptions = {
                    "titleText": "Gresham Map",
                    "legendLayers": [Legend1, Legend2, Legend3, Legend4, Legend5, Legend6, Legend7, Legend8]
                };
                return plate;
            });

            // create the print dijit
            app.printer = new Print({
                "map": app.map,
                "templates": templates,
                url: app.printUrl
            }, dom.byId("print_button"));
            app.printer.startup();
        }

        function handleError(err) {
                console.log("Something broke: ", err);
            }
        //End of Print   

        /*
        ____ ____ ____ ____ ____ _  _ 
        [__  |___ |__| |__/ |    |__| 
        ___] |___ |  | |  \ |___ |  | 
                              
        */
        //Search

        //Search Dropdown menu change
        searchCategorySelected = "Search by Address";
        $("#searchByDropDown li a").click(function() {
            searchCategorySelected = $(this).text().trim().toString();
            dojo.byId("btnSearchCategory").innerHTML = searchCategorySelected;
            if (searchCategorySelected === "Search by Address") {
                $("#iptType").attr("placeholder", "type your address");
            } else if (searchCategorySelected === "Search by RNO") {
                $("#iptType").attr("placeholder", "type a 9-dijit property ID");
            } else if (searchCategorySelected === "Search by RNO6") {
                $("#iptType").attr("placeholder", "type a 6-dijit property ID");
            } else if (searchCategorySelected === "Search by Name") {
                $("#iptType").attr("placeholder", "type an owner name");
            } else if (searchCategorySelected === "Search by State ID") {
                $("#iptType").attr("placeholder", "type a State ID");
            } else if (searchCategorySelected === "Search by Subdivision") {
                $("#iptType").attr("placeholder", "type a Subdivision name");
            } else if (searchCategorySelected === "Search by Business") {
                $("#iptType").attr("placeholder", "type a business or tenant name");
            } else if (searchCategorySelected === "Search by Manhole") {
                $("#iptType").attr("placeholder", "type a manhole ID");
            } else if (searchCategorySelected === "Search by Intersection") {
                $("#iptType").attr("placeholder", "type a cross street...");
            }else {
                console.log(searchCategorySelected.toString());
            }
            var caretInsert = document.createElement("span");
            caretInsert.className = "caret";
            document.getElementById("btnSearchCategory").appendChild(caretInsert);
        });
        //End of Search Dropdown menu change

        //apply different search functions based on browsers.  
        var userAgent = navigator.userAgent.toString().toLowerCase();
        //IE11 does not recognize userAgent so use rv variable to identify IE11.
        var rv = -1;
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(navigator.userAgent) != null) rv = parseFloat(RegExp.$1);
        } else if (navigator.appName == 'Netscape') {
            var re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(navigator.userAgent) != null) rv = parseFloat(RegExp.$1);
        }

        //define stringStartsWith function
        function stringStartsWith(string, prefix) {
            return string.slice(0, prefix.length) == prefix;
        }

        function handleSearch(){

            searchInput = $("input[id=iptType]").val();
            var dirty = (new Date()).getTime();
            if (searchInput) {
                if (searchCategorySelected == "Search by Address") {

                    if (searchInput.indexOf(",") > -1) {
                        var newSearchInput = searchInput.split(",");
                        queryA.where = "STREET_NUM like '" + newSearchInput[0] + "%'" + " AND " + "STREET_NAME like '" + newSearchInput[1].trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskA.execute(queryA, function(results) {
                            showQueryResultsA(results);
                        });
                    }
                    //search for intersection query
                    else if (searchInput.indexOf(" & ") > -1 || searchInput.toUpperCase().includes(" AND ")) {

                        //Todo -- ESRI-fy this query, but for the moment we're going to jQuery it....

                        $.getJSON('http://maps.greshamoregon.gov/arcgis/rest/services/Tools/COG_Street_DualRangesType/GeocodeServer/findAddressCandidates?Single+Line+Input='+searchInput.replace(/\&/,' AND ')+'+%2C+GRSM&f=pjson').then(function(results){
                            showQueryResultsInt(results);
                        });

                    } else {
                        //search only for street name
                        var newSearchInput = searchInput.split(" ");
                        if (isInt(newSearchInput[0])) {

                            if (newSearchInput[1]) var fInput = newSearchInput[1].toUpperCase();
                            else var fInput = "nothing";
                            //check if address input has direction with address number
                            if (fInput === "E" || fInput === "N" || fInput === "NE" || fInput === "NW" || fInput === "S" || fInput === "SE" || fInput === "SW" || fInput === "W" || fInput === "nothing") {
                                queryA.where = "FULLADDR like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                                queryTaskA.execute(queryA, function(results) {
                                    showQueryResultsA(results);
                                });
                            }
                            //when address input does not have a direction
                            else {
                                if (newSearchInput[2]) var streetTypeInout = newSearchInput[2];
                                else var streetTypeInout = "";
                                queryA.where = "STREET_NUM like '" + newSearchInput[0].trim() + "'" + " AND " + "STREET_NAME like '" + fInput.trim().toUpperCase() + "%'" + " AND STREET_TYPE like '" + streetTypeInout.trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                                queryTaskA.execute(queryA, function(results) {
                                    showQueryResultsA(results);
                                });
                            }
                        } else {
                            var fInput = newSearchInput[0].toUpperCase();
                            if (fInput === "E" || fInput === "N" || fInput === "NE" || fInput === "NW" || fInput === "S" || fInput === "SE" || fInput === "SW" || fInput === "W") {
                                if (newSearchInput[2]) var streetTypeInout = newSearchInput[2];
                                else var streetTypeInout = "";
                                queryA.where = "STREET_DIR like '" + fInput + "'" + " AND " + "STREET_NAME like '" + newSearchInput[1].trim().toUpperCase() + "%'" + " AND STREET_TYPE like '" + streetTypeInout.trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                                queryTaskA.execute(queryA, function(results) {
                                    showQueryResultsA(results);
                                });
                            } else if (stringStartsWith(fInput, "1N") || stringStartsWith(fInput, "1S")) {
                                queryA.where = "FULLADDR like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                                queryTaskA.execute(queryA, function(results) {
                                    showQueryResultsA(results);
                                });
                            } else {
                                if (newSearchInput[1]) var streetTypeInout = newSearchInput[1];
                                else var streetTypeInout = "";
                                queryA.where = "STREET_NAME like '" + newSearchInput[0].trim().toUpperCase() + "%'" + " AND STREET_TYPE like '" + streetTypeInout.trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                                queryTaskA.execute(queryA, function(results) {
                                    showQueryResultsA(results);
                                });
                            }
                        }
                    }
                } else if (searchCategorySelected == "Search by RNO") {
                    if (searchInput.substring(0, 1).toUpperCase() === "R") {
                        queryPa.where = "RNO like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskPa.execute(queryPa, function(results) {
                            showQueryResults(results);
                        });
                    } else {
                        queryPa.where = "RNO like 'R" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskPa.execute(queryPa, function(results) {
                            showQueryResults(results);
                        });
                    }
                } else if (searchCategorySelected == "Search by RNO6") {
                    if (searchInput.substring(0, 1).toUpperCase() === "R") {
                        queryPa.where = "RNO6 like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskPa.execute(queryPa, function(results) {
                            showQueryResults(results);
                        });
                    } else {
                        queryPa.where = "RNO6 like 'R" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskPa.execute(queryPa, function(results) {
                            showQueryResults(results);
                        });
                    }
                } else if (searchCategorySelected == "Search by Name") {
                    queryPa.where = "OWNER1 like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskPa.execute(queryPa, function(results) {
                        showQueryResults(results);
                    });
                } else if (searchCategorySelected == "Search by State ID") {
                    var sIDInput = searchInput.toUpperCase();
                    if (sIDInput.indexOf("-") > -1) {
                        var sIDInputArray = sIDInput.split("-");
                        if (sIDInputArray[1].length == 4) var sIDInputNew = "0" + sIDInputArray[1];
                        else if (sIDInputArray[1].length == 3) var sIDInputNew = "00" + sIDInputArray[1];
                        else if (sIDInputArray[1].length == 2) var sIDInputNew = "000" + sIDInputArray[1];
                        else if (sIDInputArray[1].length == 1) var sIDInputNew = "0000" + sIDInputArray[1];
                        else var sIDInputNew = sIDInputArray[1];
                        var sIDInputNew0 = sIDInputArray[0].split(/[ ]+/)[0].trim();
                        if (sIDInputNew0.length == 7) sIDInputNew0 = sIDInput.substr(0, 7) + " ";
                        else if (sIDInputNew0.length == 6) sIDInputNew0 = sIDInput.substr(0, 6) + "  ";
                        sIDInput = sIDInputNew0 + "  -" + sIDInputNew;
                    } else {
                        if (sIDInput.indexOf(" ") > -1) {
                            var sIDInputArray = sIDInput.split(/[ ]+/);
                            if (sIDInputArray[1].length == 4) var sIDInputNew = "0" + sIDInputArray[1];
                            else if (sIDInputArray[1].length == 3) var sIDInputNew = "00" + sIDInputArray[1];
                            else if (sIDInputArray[1].length == 2) var sIDInputNew = "000" + sIDInputArray[1];
                            else if (sIDInputArray[1].length == 1) var sIDInputNew = "0000" + sIDInputArray[1];
                            else var sIDInputNew = sIDInputArray[1];

                            if (sIDInputArray[0].length == 7) sIDInputNew0 = sIDInputArray[0] + " ";
                            else if (sIDInputArray[0].length == 6) sIDInputNew0 = sIDInputArray[0] + "  ";
                            else var sIDInputNew0 = sIDInput.substr(0, 8);
                            sIDInput = sIDInputNew0 + "  -" + sIDInputNew;
                        }
                    }
                    queryPa.where = "STATEID like '" + sIDInput + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskPa.execute(queryPa, function(results) {
                        showQueryResults(results);
                    });
                } else if (searchCategorySelected == "Search by Subdivision") {
                    //define queries
                    queryTaskSD = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/gview2/GVII/MapServer/26");
                    querySD = new esri.tasks.Query();
                    querySD.returnGeometry = true;
                    querySD.outFields = ["*"];

                    querySD.where = "LEGAL like '%" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskSD.execute(querySD, function(results) {
                        showQueryResultsSD(results);
                    });
                } else if (searchCategorySelected == "Search by Business") {
                    //define queries
                    queryTaskBu = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/gview/ShortList/MapServer/1");
                    queryBu = new esri.tasks.Query();
                    queryBu.returnGeometry = true;
                    queryBu.outFields = ["*"];

                    queryBu.where = "BUSNAME like '%" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskBu.execute(queryBu, function(results) {
                        showQueryResultsBu(results);
                    });
                } else if (searchCategorySelected == "Search by Manhole") {
                    //define queries
                    queryTaskMH = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/gview2/WasteWater/MapServer/0");
                    queryMH = new esri.tasks.Query();
                    queryMH.returnGeometry = true;
                    queryMH.outFields = ["*"];

                    queryMH.where = "ID like '%" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskMH.execute(queryMH, function(results) {
                        showQueryResultsMH(results);
                    });
                } else if (searchCategorySelected == "Search by intersection"){

                }
            }
        }

        if (rv == 11 || userAgent.indexOf('ie') != -1) {
            $("input[name=searchTypeField]").keydown(function(e) {
                if (e.keyCode == 13) { // Checks for the enter key
                    e.preventDefault(); // Stops IE from triggering the button to be clicked
                    handleSearch();
                }
            }); 
        } else {   //firefox, chrome and other browsers
            $("input[name=searchTypeField]").change(function() {
                handleSearch()
            });
        }

        //End of Search


        //Query Functions    
        function showQueryResults(results) {
            //set search results polygon symbol
  
            var symbolQuery = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SHORTDASH, new dojo.Color([255, 0, 0]), 3), new dojo.Color([255, 255, 0]));
 
            app.map.graphics.clear();
            var infoContent = "";
            var addrContent = "";

            if (results.features.length < 1) {
                infoContent = "<br />No matching record was found in the map layer. If you are searching for an old property, you may find it in the HTE land database system. Click '<b>Search HTE Database</b>' button below. <br /><button onclick='javascript:hteSearch();' class='btnSubmit' data-role='button' id='btnHTE' data-mini='true' data-theme='b' data-corners='true' style='width:100%; min-height::35px;margin:5px;border-radius:15px;'>Search HTE Database</button>";

                var dirty = (new Date()).getTime();

                //Search by RNO from address
                if (searchCategorySelected == "Search by RNO") {
                    if (searchInput.substring(0, 1).toUpperCase() === "R") {
                        queryA.where = "RNO like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskA.execute(queryA, function(resultsA) {
                            if (resultsA.features.length > 0) {
                                showQueryResultsA(resultsA);
                            } else {
                                dom.byId("featureCount").innerHTML = "";
                                dom.byId("leftPane").innerHTML = infoContent;
                                openRightPanelSTab();
                            }
                        });
                    } else {
                        queryA.where = "RNO like 'R" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskA.execute(queryA, function(resultsA) {
                            if (resultsA.features.length > 0) {
                                showQueryResultsA(resultsA);
                            } else {
                                dom.byId("featureCount").innerHTML = "";
                                dom.byId("leftPane").innerHTML = infoContent;
                                openRightPanelSTab();
                            }
                        });
                    }
                }
                //Search by RNO6 from address
                else if (searchCategorySelected == "Search by RNO6") {
                    if (searchInput.substring(0, 1).toUpperCase() === "R") {
                        queryA.where = "RNO6 like '" + searchInput.toUpperCase().substr(1, 6) + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskA.execute(queryA, function(resultsA) {
                            if (resultsA.features.length > 0) {
                                showQueryResultsA(resultsA);
                            } else {
                                dom.byId("featureCount").innerHTML = "";
                                dom.byId("leftPane").innerHTML = infoContent;
                                openRightPanelSTab();
                            }
                        });
                    } else {
                        queryA.where = "RNO6 like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                        queryTaskA.execute(queryA, function(resultsA) {
                            if (resultsA.features.length > 0) {
                                showQueryResultsA(resultsA);
                            } else {
                                dom.byId("featureCount").innerHTML = "";
                                dom.byId("leftPane").innerHTML = infoContent;
                                openRightPanelSTab();
                            }
                        });
                    }
                }
                //search by something other than RNO or RNO6
                else {
                    dom.byId("featureCount").innerHTML = "";
                    dom.byId("leftPane").innerHTML = infoContent;
                    openRightPanelSTab();
                }

            } else if (results.features.length > 1) {
                dojo.byId("leftPane").innerHTML = "";
                addrContent += '<ul>';
                for (var k = 0; k < results.features.length; k++) {
                    var graphic1 = results.features[k];
                    var attr1 = graphic1.attributes;
                    var searchRList = "";
                    if (searchCategorySelected == "Search by Address") searchRList = "Address: " + attr1.FULLADDR;
                    else if (searchCategorySelected == "Search by RNO") searchRList = "RNO ID: " + attr1.RNO + "<br/>Address: " + attr1.SITEADDR;
                    else if (searchCategorySelected == "Search by RNO6") searchRList = "Property ID: " + attr1.RNO6 + "<br/>Address: " + attr1.SITEADDR;
                    else if (searchCategorySelected == "Search by Name") searchRList = "OWNER: " + attr1.OWNER1 + "<br/>Address: " + attr1.SITEADDR + "<br />RNO: " + attr1.RNO;
                    else if (searchCategorySelected == "Search by State ID") searchRList = "State ID: " + attr1.STATEID + "<br/>Address: " + attr1.SITEADDR;
                    else if (searchCategorySelected == "Search by Subdivision") searchRList = "Subdivision: " + attr1.LEGAL + "<br/>Address: " + attr1.SITEADDR;

                    var content1 = "<li><a href='#' onclick='findRNO1(" + k + "),deleteList()'>" + searchRList + "</a></li>";
                    addrContent += content1;
                }
                addrContent += '</ul>';
                var addrCount = "<div>" + "We found " + results.features.length.toString() + " matches.<br /></div>";
                dom.byId("featureCount").innerHTML = "";
                dom.byId("leftPane").innerHTML = addrCount + addrContent;
                openRightPanelSTab();
            } else {
                //Census info
                var point = results.features[0].geometry;
                var censusTractNo;
                queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
                queryC = new esri.tasks.Query();
                queryC.returnGeometry = true;
                queryC.outFields = ["*"];
                queryC.geometry = point;
                queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                queryTaskC.execute(queryC, function(resultsC) {
                    if (resultsC.features.length === 1) {
                        var graphicC = resultsC.features[0];
                        
                        dojo.byId("featureCount").innerHTML = "";
                        var graphic = results.features[0];
                        graphic.setSymbol(symbolQuery);
						
                        var attr = graphic.attributes;

                        var attrC = graphicC.attributes;
                        attr.censusTractNo = attrC.TRACT;

                        var stateIDfirst = attr.STATEID.split(" ")[0];
                        attr.newState_ID = "<a href='http://www4.multco.us/surveyimages/dist/assr/out/" + stateIDfirst + ".pdf' onclick='window.open(this.href," + '"' + "window" + '"' + ',' + '"' + 'resizable,scrollbars,titlebar=no' + '"' + ");return false;'>Link</a>";
                        attr.newRNO = attr.RNO.replace("R", "");

                        var content = app.parcelTemplate({attr:attr});

                        infoContent += content;
                        app.map.graphics.add(graphic);

                        selectedParcelGeometry = results.features[0].geometry;

                        dom.byId("leftPane").innerHTML = infoContent;

                        //set zoom extent 
                        var selectedExtent = results.features[0].geometry.getExtent();
                        app.map.setExtent(selectedExtent);
                        openRightPanelSTab();

                    }
                });
            }
        }

        function showQueryResultsBu(results) {
            //set search results polygon symbol
            var symbolQueryBu = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
                new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                    new dojo.Color([210, 105, 30, 0.5]), 8),
                new dojo.Color([210, 105, 30, 0.9])
            );

            app.map.graphics.clear();
            var infoContent = "";
            var addrContent = "";
            var addrContentTe = "";

            if (results.features.length < 1) {

                //tenant search
                var queryTaskTe = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/AddressPts/MapServer/2");
                var queryTe = new esri.tasks.Query();
                queryTe.returnGeometry = false;
                queryTe.outFields = ["*"];

                var dirty = (new Date()).getTime();
                queryTe.where = "AGAETX like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                queryTaskTe.execute(queryTe, function(resultsTe) {
                    if (resultsTe.features.length < 1) {
                        infoContent = "<b>No matching record was found. Please make sure you typed a valid entry.</b>";
                        dom.byId("featureCount").innerHTML = "";
                        dom.byId("leftPane").innerHTML = infoContent;
                        openRightPanelSTab();
                    } else if (resultsTe.features.length > 1) {
                        dojo.byId("leftPane").innerHTML = "";
                        addrContentTe += '<ul>';
                        for (var k = 0; k < resultsTe.features.length; k++) {
                            var graphic1 = resultsTe.features[k];
                            var attr1 = graphic1.attributes;
                            var searchRList = "Tenants: " + attr1.AGAETX + "<br/>Location ID: " + attr1.AHAUCD;
                            var content1 = "<li><a href='#' onclick='findRNO3(" + k + "),deleteList()'>" + searchRList + "</a></li>";
                            addrContentTe += content1;
                        }
                        addrContentTe += '</ul>';
                        var addrCountTe = "<div><b>Tenants:</b><br/>" + "We found " + resultsTe.features.length.toString() + " matches.<br /></div>";
                        dom.byId("featureCount").innerHTML = "";
                        dom.byId("leftPane").innerHTML = addrCountTe + addrContentTe;
                        openRightPanelSTab();

                    } else {
                        queryA.where = "LOCID = " + resultsTe.features[0].attributes.AHAUCD + " AND " + dirty + "=" + dirty;
                        queryTaskA.execute(queryA, function(resultsTeA) {
                            showQueryResultsA(resultsTeA);
                        });
                    }
                });


            } else if (results.features.length > 1) {
                dojo.byId("leftPane").innerHTML = "";
                addrContent += '<ul>';
                for (var k = 0; k < results.features.length; k++) {
                    var graphic1 = results.features[k];
                    var attr1 = graphic1.attributes;
                    var searchRList = "Business: " + attr1.BUSNAME + "<br/>Address: " + attr1.ADDRESS;
                    var content1 = "<li><a href='#' onclick='findRNO1(" + k + "),deleteList()'>" + searchRList + "</a></li>";
                    addrContent += content1;
                }
                addrContent += '</ul>';
                var addrCount = "<div><b>Businesses:</b> <br/>" + "We found " + results.features.length.toString() + " matches.<br /></div>";

                //tenant search
                var queryTaskTe = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/AddressPts/MapServer/2");
                var queryTe = new esri.tasks.Query();
                queryTe.returnGeometry = false;
                queryTe.outFields = ["*"];

                var addrCountTe = "";
                var dirty = (new Date()).getTime();
                queryTe.where = "AGAETX like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                queryTaskTe.execute(queryTe, function(resultsTe) {
                    if (resultsTe.features.length < 1) {
                        addrCountTe = "";
                        addrContentTe = "";
                    } else if (resultsTe.features.length > 1) {
                        dojo.byId("leftPane").innerHTML = "";
                        addrContentTe += '<ul>';
                        for (var k = 0; k < resultsTe.features.length; k++) {
                            var graphic1Te = resultsTe.features[k];
                            var attr1Te = graphic1Te.attributes;
                            var searchRListTe = "Tenants: " + attr1Te.AGAETX + "<br/>Location ID: " + attr1Te.AHAUCD;
                            var content1Te = "<li><a href='#' onclick='findRNO3(" + k + "),deleteList()'>" + searchRListTe + "</a></li>";
                            addrContentTe += content1Te;
                        }
                        addrContentTe += '</ul>';
                        addrCountTe = "<div><b>Tenants:</b> <br/>" + "We found " + resultsTe.features.length.toString() + " matches.<br /></div>";

                    } else {
                        addrContentTe = "<ul><li><a href='#' onclick='findRNO3(0),deleteList()'>" + "Tenants: " + resultsTe.features[0].attributes.AGAETX + "<br/>Location ID: " + resultsTe.features[0].attributes.AHAUCD + "</a></li></ul>";
                        addrCountTe = "<div><b>Tenants:</b> <br/>" + "We found one match.<br /></div>";
                    }
                    dom.byId("featureCount").innerHTML = "";
                    dom.byId("leftPane").innerHTML = addrCount + addrContent + "<br/>" + addrCountTe + addrContentTe;
                    openRightPanelSTab();
                });
            } else {
                //tenant search
                var queryTaskTe = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/AddressPts/MapServer/2");
                var queryTe = new esri.tasks.Query();
                queryTe.returnGeometry = false;
                queryTe.outFields = ["*"];

                var addrCountTe = "";
                var dirty = (new Date()).getTime();
                queryTe.where = "AGAETX like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                queryTaskTe.execute(queryTe, function(resultsTe) {
                    //when there is no tenants and one business;
                    if (resultsTe.features.length < 1) {

                        //Census info
                        var point = results.features[0].geometry;
                        var censusTractNo;
                        queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
                        queryC = new esri.tasks.Query();
                        queryC.returnGeometry = true;
                        queryC.outFields = ["*"];
                        queryC.geometry = point;
                        queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                        queryTaskC.execute(queryC, function(resultsC) {
                            //console.log("census query results: " + resultsC.features.length);
                            if (resultsC.features.length === 1) {
                                var graphicC = resultsC.features[0];
                                var attrC = graphicC.attributes;
                                censusTractNo = attrC.TRACT;
                                dojo.byId("featureCount").innerHTML = "";
                                var graphic = results.features[0];
                                graphic.setSymbol(symbolQueryBu);

                                var attr = graphic.attributes;
                                var newRNO = attr.RNO.replace("R", "");
                                var newAddress = attr.ADDRESS.toString().replace(/ +(?= )/g, '');
                                //check parcel number, owner, and address
                                var openDateBu = new Date(attr.OPENED);
                                openDateBu = openDateBu.toLocaleString();
                                var content = '<div class="tab-pane active" id="searchResultsInfoW"><div class="panel-group" id="accordionSearch"><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseOneSearch">Business Information</a></h4></div><div id="collapseOneSearch" class="panel-collapse collapse in"><div class="panel-body"><table id="pi"><tr><td>Business Name</td><td>' + attr.BUSNAME + '</td></tr><tr><td>RNO</td><td>' + attr.RNO + '</td></tr><tr><td>Address</td><td>' + newAddress + '</td></tr><tr><td>City/Zip</td><td>' + attr.City + '&nbsp;' + attr.State + '&nbsp;' + attr.Zip_Code + '</td></tr><tr><td>Mailing Address</td><td>' + attr.MAILING + '&nbsp;' + attr.MAILING2 + '</td></tr><tr><td>Mail City/Zip</td><td>' + attr.MAILCITY + '&nbsp;' + attr.MAILSTATE + '&nbsp;' + attr.MAILZIP + '</td></tr><tr><td>Phone</td><td>' + attr.PHONE + '</td></tr><tr><td>NAICS Code</td><td>' + attr.NAICS_Code + '</td></tr><tr><td>Business Type</td><td>' + attr.NAICSDESC + '</td></tr><tr><td>License</td><td>' + attr.License + '</td></tr><tr><td>Number of Employees</td><td>' + attr.EMPLOYEES + '</td></tr><tr><td>Open Date</td><td>' + openDateBu + '</td></tr></table></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseTwoSearch">SunGard/HTE Information</a></h4></div><div id="collapseTwoSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="http://leia/asp/greshamgis/arcims_process_edit3.asp?IDValue=' + newRNO + '" frameborder="0" width="100%" height="500px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseFiveSearch">Notes</a></h4></div><div id="collapseFiveSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="http://leia/asp/greshamgis/parcel_view.asp?rno=' + newRNO + '" frameborder="0" width="100%" height="500px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseThreeSearch">District Information from METRO</a></h4></div><div id="collapseThreeSearch" class="panel-collapse collapse"><div class="panel-body"><iframe src="metroreport.html?ID=' + newAddress + '" frameborder="0" width="100%" height="600px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapsefourSearch">More information from County</a></h4></div><div id="collapsefourSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="parcelreport.html?ID=' + attr.RNO + '"  frameborder="0" width="100%" height="480px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapsefiveSearch">Census information</a></h4></div><div id="collapsefiveSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="censusreport.html?TRACT=' + censusTractNo + '"  frameborder="0" width="100%" height="520px"></iframe></div></div></div></div></div></div>';

                                infoContent += content;
                                //console.log(content);        
                                app.map.graphics.add(graphic);

                                selectedParcelGeometry = results.features[0].geometry;

                                dom.byId("leftPane").innerHTML = infoContent;

                                //set zoom extent 
                                app.map.centerAndZoom(results.features[0].geometry, 8);

                                openRightPanelSTab();

                            }
                        });
                    }
                    //when there is one business and multiple tenants
                    else if (resultsTe.features.length > 1) {
                        //business search result
                        addrContent = "<ul><li><a href='#' onclick='findRNO1(0),deleteList()'>" + "Business: " + results.features[0].attributes.BUSNAME + "<br/>Address: " + results.features[0].attributes.ADDRESS + "</a></li></ul>";
                        addrCount = "<div><b>Business:</b> <br/>" + "We found one match.<br /></div>";

                        //tenant search result
                        dojo.byId("leftPane").innerHTML = "";
                        addrContentTe += '<ul>';
                        for (var k = 0; k < resultsTe.features.length; k++) {
                            var graphic1 = resultsTe.features[k];
                            var attr1 = graphic1.attributes;
                            var searchRList = "Tenants: " + attr1.AGAETX + "<br/>Location ID: " + attr1.AHAUCD;
                            var content1 = "<li><a href='#' onclick='findRNO3(" + k + "),deleteList()'>" + searchRList + "</a></li>";
                            addrContentTe += content1;
                        }
                        addrContentTe += '</ul>';
                        var addrCountTe = "<div><b>Tenants:</b><br/>" + "We found " + resultsTe.features.length.toString() + " matches.<br /></div>";
                        dom.byId("featureCount").innerHTML = "";
                        dom.byId("leftPane").innerHTML = addrCount + addrContent + "<br/>" + addrCountTe + addrContentTe;
                        openRightPanelSTab();
                    }
                    //when there is one business and one tenant;
                    else {
                        //business search result
                        addrContent = "<ul><li><a href='#' onclick='findRNO1(0),deleteList()'>" + "Business: " + results.features[0].attributes.BUSNAME + "<br/>Address: " + results.features[0].attributes.ADDRESS + "</a></li></ul>";
                        addrCount = "<div><b>Business:</b> <br/>" + "We found one match.<br /></div>";

                        //tenants search result
                        addrContentTe = "<ul><li><a href='#' onclick='findRNO3(0),deleteList()'>" + "Tenants: " + resultsTe.features[0].attributes.AGAETX + "<br/>Location ID: " + resultsTe.features[0].attributes.AHAUCD + "</a></li></ul>";
                        addrCountTe = "<div><b>Tenants:</b> <br/>" + "We found one match.<br /></div>";
                        dom.byId("featureCount").innerHTML = "";
                        dom.byId("leftPane").innerHTML = addrCount + addrContent + "<br/>" + addrCountTe + addrContentTe;
                        openRightPanelSTab();
                    }

                }); //end of tenants search

            } // end of else - one search results     
        }

        function showQueryResultsMH(results) { 
                var symbolQueryMH = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                        new dojo.Color([210, 105, 30, 0.5]), 8),
                    new dojo.Color([210, 105, 30, 0.9])
                );

                app.map.graphics.clear();
                var infoContent = "";
                var addrContent = "";
                var addrContentTe = "";

                if (results.features.length < 1) {
                    infoContent = "<b>No matching record was found. Please make sure you typed a valid entry.</b>";
                    dom.byId("featureCount").innerHTML = "";
                    dom.byId("leftPane").innerHTML = infoContent;
                    openRightPanelSTab();
                } else if (results.features.length > 1) {
                    dojo.byId("leftPane").innerHTML = "";
                    addrContent += '<ul>';
                    for (var k = 0; k < results.features.length; k++) {
                        var graphic1 = results.features[k];
                        var attr1 = graphic1.attributes;
                        var searchRList = "Manholes: " + attr1.ID;
                        var content1 = "<li><a href='#' onclick='findMH(" + k + "),deleteList()'>" + searchRList + "</a></li>";
                        addrContent += content1;
                    }
                    addrContent += '</ul>';
                    var addrCount = "<div><b>Manhole ID:</b> <br/>" + "We found " + results.features.length.toString() + " matches.<br /></div>";
                    dom.byId("featureCount").innerHTML = "";
                    dom.byId("leftPane").innerHTML = addrCount + addrContent;
                    openRightPanelSTab();
                } else {

                    dojo.byId("featureCount").innerHTML = "";
                    var graphic = results.features[0];
                    graphic.setSymbol(symbolQueryMH);

                    var attr = graphic.attributes;
                    //check parcel number, owner, and address
                    var content = '<div class="tab-pane active" id="searchResultsInfoW"><div class="panel-group" id="accordionSearch"><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseOneSearch">Manhole Information</a></h4></div><div id="collapseOneSearch" class="panel-collapse collapse in"><div class="panel-body"><table id="pi"><tr><td>ID</td><td>' + attr.ID + '</td></tr><tr><td>Type</td><td>' + attr.TYPE + '</td></tr><tr><td>Map No.</td><td>' + attr.MAPNO + '</td></tr><tr><td>Basin</td><td>' + attr.BASIN + '</td></tr><tr><td>Manhole Number</td><td>' + attr.MHNUM + '</td></tr><tr><td>Status</td><td>' + attr.Status + '</td></tr><tr><td>Owner</td><td>' + attr.Owner + '</td></tr><tr><td>Comments</td><td>' + attr.Comments + '</td></tr><tr><td>Off Road</td><td>' + attr.Offroad + '</td></tr><tr><td>Asbuilt Year</td><td>' + attr.YR_ASBLT + '</td></tr><tr><td>RIM</td><td>' + attr.RIM + '</td></tr><tr><td>Elevation Out</td><td>' + attr.ELVOUT + '</td></tr><tr><td>Elevation In</td><td>' + attr.ELVINDS + '</td></tr></table></div></div></div></div></div></div>';

                    infoContent += content;
                    //console.log(content);        
                    app.map.graphics.add(graphic);

                    selectedParcelGeometry = results.features[0].geometry;

                    dom.byId("leftPane").innerHTML = infoContent;

                    //set zoom extent 
                    app.map.centerAndZoom(results.features[0].geometry, 8);
                    openRightPanelSTab();

                }
        } // end of Manhole search

        function showQueryResultsSD(results) {
                var symbolQuerySD = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SHORTDASH, new dojo.Color([255, 0, 0]), 3), new dojo.Color([255, 255, 0]));

                app.map.graphics.clear();
                var infoContent = "";
                var addrContent = "";
                var addrContentTe = "";

                if (results.features.length < 1) {
                    infoContent = "<b>No matching record was found. Please make sure you typed a valid entry.</b>";
                    dom.byId("featureCount").innerHTML = "";
                    dom.byId("leftPane").innerHTML = infoContent;
                    openRightPanelSTab();
                } else if (results.features.length > 1) {
                    dojo.byId("leftPane").innerHTML = "";
                    addrContent += '<ul>';
                    for (var k = 0; k < results.features.length; k++) {
                        var graphic1 = results.features[k];
                        var attr1 = graphic1.attributes;
                        var searchRList = "Subdivision: " + attr1.LEGAL;
                        var content1 = "<li><a href='#' onclick='findSD(" + k + "),deleteList()'>" + searchRList + "</a></li>";
                        addrContent += content1;
                    }
                    addrContent += '</ul>';
                    var addrCount = "<div><b>Subdivision:</b> <br/>" + "We found " + results.features.length.toString() + " matches.<br /></div>";
                    dom.byId("featureCount").innerHTML = "";
                    dom.byId("leftPane").innerHTML = addrCount + addrContent;
                    openRightPanelSTab();
                } else {

                    dojo.byId("featureCount").innerHTML = "";
                    var graphicSD = results.features[0];
                    graphicSD.setSymbol(symbolQuerySD);

                    var attr = graphicSD.attributes;

                    var folderLo = attr.Folder;
                    var folderLoLink = folderLo.replace(/\\/g, "/");
                    console.log(folderLoLink);
                    //check parcel number, owner, and address
                    var content = '<div class="tab-pane active" id="searchResultsInfoW"><div class="panel-group" id="accordionSearch"><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseOneSearch">Subdivision Information</a></h4></div><div id="collapseOneSearch" class="panel-collapse collapse in"><div class="panel-body"><table id="pi"><tr><td>Name</td><td>' + attr.LEGAL + '</td></tr><tr><td>Type</td><td>' + attr.TYPE + '</td></tr><tr><td>Folder</td><td><a href="file://' + folderLoLink + '" target="_blank" alt="folder Location">' + attr.Folder + '</a></td></tr></table></div></div></div></div></div></div>';

                    infoContent += content;
                    //console.log(content);        
                    app.map.graphics.add(graphicSD);

                    selectedParcelGeometry = results.features[0].geometry;

                    dom.byId("leftPane").innerHTML = infoContent;

                    //set zoom extent 
                    var selectedExtent = results.features[0].geometry.getExtent();
                    app.map.setExtent(selectedExtent);

                    openRightPanelSTab();

                }
            } // end of Subdivision search

        function showQueryResultsA(results) {
            //set search results polygon symbol
            var symbolPts = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
                new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                    new dojo.Color([210, 105, 30, 0.5]), 8),
                new dojo.Color([210, 105, 30, 0.9])
            );
            app.map.graphics.clear();
            var infoContent = "";
            var addrContent = "";
            if (results.features.length < 1) {
                infoContent = "<br />No matching record was found in the map layer. If you are searching for an old property, you may find it in the HTE land database system. Click '<b>Search HTE Database</b>' button below. <br /><button onclick='javascript:hteSearch();' class='btnSubmit' data-role='button' id='btnHTE' data-mini='true' data-theme='b' data-corners='true' style='width:100%; min-height::35px;margin:5px;border-radius:15px;'>Search HTE Database</button>";
                dom.byId("featureCount").innerHTML = "";
                dom.byId("leftPane").innerHTML = infoContent;
                openRightPanelSTab();
            } else if (results.features.length > 1) {
                dojo.byId("leftPane").innerHTML = "";
                addrContent += '<ul id="asc">';
                for (var k = 0; k < results.features.length; k++) {
                    var graphic1 = results.features[k];
                    var attr1 = graphic1.attributes;
                    var searchRList = "";
                    searchRList = "Address: " + attr1.FULLADDR;
                    var content1 = "<li><a href='javascript:findRNO2(" + k + "),deleteList()'>" + searchRList + "</a></li>";
                    addrContent += content1;
                }
                addrContent += '</ul>';
                var addrCount = "<div>" + "We found " + results.features.length.toString() + " matches.<br /></div>";
                dom.byId("featureCount").innerHTML = "";

                var hteSearchAdd = "<br/><b>HTE Search</b><br />If you are searching for an old property that can no longer be located, you may find it in our HTE land database system.<br /><button onclick='javascript:hteSearch();' class='btnSubmit' data-role='button' id='btnHTE' data-mini='true' data-theme='b' data-corners='true' style='width:100%; min-height::35px;margin:5px;border-radius:15px;'>Search HTE Database</button>";

                dom.byId("leftPane").innerHTML = addrCount + addrContent + hteSearchAdd;
                openRightPanelSTab();
            } else {
                dojo.byId("featureCount").innerHTML = "";
                var graphic = results.features[0];
                graphic.setSymbol(symbolPts);
                var attr = graphic.attributes;
                var addressStreetaddr = attr.FULLADDR;
                var addressRNO = attr.RNO;
                var addressRNO6 = attr.RNO6;
                var addressStateid = attr.STATEID;
                var addressCity = attr.CITY;
                var addressZip = attr.ZIPCODE;
                var addressStatus = attr.ADDRSTATUS;
                var addrStatus = "";
                if (addressStatus) {
                    if (addressStatus == "I") addrStatus = "Inactive";
                    else if (addressStatus == "D") addrStatus = "Demolished";
                    else if (addressStatus == "T") addrStatus = "Temporary";
                }

                app.map.graphics.add(graphic);
                pointAnimate()
                    //Census info
                var point = graphic.geometry;
                var censusTractNo;
                queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
                queryC = new esri.tasks.Query();
                queryC.returnGeometry = true;
                queryC.outFields = ["*"];
                queryC.geometry = point;
                queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                queryTaskC.execute(queryC, function(resultsC) {
                    if (resultsC.features.length === 1) {
                        var graphicC = resultsC.features[0];
                        var attrC = graphicC.attributes;
                        censusTractNo = attrC.TRACT;
                        //End of Census info

                        //set zoom extent 
                        selectedParcelGeometry = results.features[0].geometry;
                        findParcel(addressStreetaddr, addressRNO, addressRNO6, addressStateid, addressCity, addressZip, censusTractNo, addrStatus);

                    }
                });
                app.map.centerAndZoom(results.features[0].geometry, 8);
            }
        }

        function showQueryResultsInt(results){

            var symbolPts = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
                new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                    new dojo.Color([210, 105, 30, 0.5]), 8),
                new dojo.Color([210, 105, 30, 0.9])
            );
            app.map.graphics.clear();
            var infoContent = "";
            var addrContent = "";

            if(results.candidates.length == 0){
                infoContent = "<br />No matching intersection was found...";
                dom.byId("featureCount").innerHTML = "";
                dom.byId("leftPane").innerHTML = infoContent;
                openRightPanelSTab();
            } else if (results.candidates.length ==1){

                var candidate = results.candidates[0];

                dojo.byId("featureCount").innerHTML = "";
                dom.byId("leftPane").innerHTML = '<b>Intersection: </b>'+candidate.address +'<br/>Score: '+candidate.score ;
                var markerSymbol = new SimpleMarkerSymbol();
                markerSymbol.setPath("M16,4.938c-7.732,0-14,4.701-14,10.5c0,1.981,0.741,3.833,2.016,5.414L2,25.272l5.613-1.44c2.339,1.316,5.237,2.106,8.387,2.106c7.732,0,14-4.701,14-10.5S23.732,4.938,16,4.938zM16.868,21.375h-1.969v-1.889h1.969V21.375zM16.772,18.094h-1.777l-0.176-8.083h2.113L16.772,18.094z");
                markerSymbol.setColor(new Color("#00FFFF"));

                var graphic = new Graphic(new Point(candidate.location,app.map.spatialReference), symbolPts);

                app.map.graphics.add(graphic);
            
                app.map.centerAndZoom(candidate.location, 6);
                openRightPanelSTab();
            } else if (results.candidates.length > 1){
                
                dojo.byId("leftPane").innerHTML = "";
                intrsContent = '<ul id="asc">';
                results.candidates.forEach(function(cand){
                    var content1 = "<li><a class='intersection-candidate' href='#' data-coords='"+JSON.stringify(cand.location)+"'>" + cand.address + "<br/><i>"+cand.score+"</i></a></li>";
                    intrsContent += content1;
                })
                
                intrsContent += '</ul>';
                var intrsCount = "<div>" + "We found " + results.candidates.length.toString() + " matches.<br /></div>";

                dom.byId("featureCount").innerHTML = "";

                dom.byId("leftPane").innerHTML = intrsCount + intrsContent;
                openRightPanelSTab();

                 $('.intersection-candidate').on('click', function(){

                    app.map.graphics.clear();

                    var coords = JSON.parse($(this).attr('data-coords'));

                    var markerSymbol = new SimpleMarkerSymbol();
                    markerSymbol.setPath("M16,4.938c-7.732,0-14,4.701-14,10.5c0,1.981,0.741,3.833,2.016,5.414L2,25.272l5.613-1.44c2.339,1.316,5.237,2.106,8.387,2.106c7.732,0,14-4.701,14-10.5S23.732,4.938,16,4.938zM16.868,21.375h-1.969v-1.889h1.969V21.375zM16.772,18.094h-1.777l-0.176-8.083h2.113L16.772,18.094z");
                    markerSymbol.setColor(new Color("#00FFFF"));

                    var graphic = new Graphic(new Point(coords,app.map.spatialReference), symbolPts);

                    app.map.graphics.add(graphic);
                
                    app.map.centerAndZoom(coords, 6);

                })
            }
        }       

        //End of Query Functions

        //Resize window
        $(window).resize(function() {
            resizeMap();
            resizeIcons();
        });
        resizeMap();
        resizeIcons();
        //End of resize window

    }
}); // End of AMD Codes

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function aerialChange(value) {
    app.map.removeAllLayers();
    app.map.addLayers([streetMap, window["aerialMap" + value], parcelLines, layerBaseData, layerBoundaries, layerEnvironmental, layerPlace, layerStormwater, layerTransportation, layerWastewater, layerWater]);
    if (opacityA) window["aerialMap" + value].setOpacity(opacityA);
    else window["aerialMap" + value].setOpacity(0);
}

//Open search results panel and tab 
function openRightPanelSTab() {
        if ($("#rightC").hasClass("hidden")) {
            $("#middleC").toggleClass("col-md-12 col-md-8");
            $("#rightC").toggleClass("hidden show");
            $("#rightC").addClass("col-md-4");
            if ($(window).width() < 992) {
                $('#map').height($(window).height() - 50 - 300);
                app.map.resize();
            }
        }
        $('#rightNavTab a[href="#searchResults"]').tab('show');
    }
    //End of Open search results panel and tab

//Right Panel Toggle Button Function          
$("#btnRightPanel").on('click', function() {

    if ($("#rightC").hasClass("hidden")) {
        $("#middleC").toggleClass("col-md-12 col-md-8");
        $("#rightC").toggleClass("hidden show");
        $("#rightC").addClass("col-md-4");
        if ($(window).width() < 992) {
            $('#map').height($(window).height() - $('#navbarHeader').height() - 300);
            app.map.resize();
        }
    } else {
        $("#middleC").toggleClass("col-md-8 col-md-12");
        $("#rightC").removeClass("col-md-4");
        $("#rightC").toggleClass("show hidden");
        $('#map').height($(window).height() - $('#navbarHeader').height());
        app.map.resize();
    }
})
//End of Right Panel Toggle Button Function          

//Right Panel Tab functions
$('#layers a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
})
$('#searchResults a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
})
$('#legends a').click(function(e) {
        alert("legend tab");
        e.preventDefault();
        $(this).tab('show');
    })
    //End of right panel tab functions

//GeoLocation
function initFunc() {
    gsvc = new esri.tasks.GeometryService("http://www.gartrellgroup.net/arcgis/rest/services/Utilities/Geometry/GeometryServer");
    dojo.connect(window, 'resize', app.map, app.map.resize);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
        //watchId = navigator.geolocation.watchPosition(showLocation, locationError); 
    } else {
        alert("Geolocation not supported on your browser.");
    }
}

function zoomToLocation(location) {
    var pt = new esri.geometry.Point(location.coords.longitude, location.coords.latitude);
    var outSR = new esri.SpatialReference({
        wkid: 2913
    });

    gsvc.project([pt], outSR, function(projectedPoints) {
        pt = projectedPoints[0];
        app.map.centerAndZoom(pt, 8);
        addGraphic(pt);
    });
}

function showLocationLocation(location) {
    //zoom to the users location and add a graphic
    var pt = new esri.geometry.Point(location.coords.longitude, location.coords.latitude);
    var outSR = new esri.SpatialReference({
        wkid: 2913
    });

    gsvc.project([pt], outSR, function(projectedPoints) {
        pt = projectedPoints[0];
        if (!geoGraphic) {
            addGraphic(pt);
        } else { //move the graphic if it already exists
            geoGraphic.setGeometry(pt);
        }
        app.map.centerAndZoom(pt, 8);
    });
}

function addGraphic(pt) {
    var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([210, 105, 30, 0.5]), 8),
        new dojo.Color([210, 105, 30, 0.9])
    );
    geoGraphic = new esri.Graphic(pt, symbol);
    app.map.graphics.add(geoGraphic);
    pointAnimate();
}

//geolocation error
function locationError(error) {
    //error occurred so stop watchPosition
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("Location not provided");
            break;

        case error.POSITION_UNAVAILABLE:
            alert("Current location not available");
            break;

        case error.TIMEOUT:
            alert("Timeout");
            break;

        default:
            alert("unknown error");
            break;
    }
}
//End of GeoLocation   

//create a string with all visiable layers for passing it to a url
$.myfunction = function() {
    var uBase = "";
    for (var i = 0; i <= $(".list_item1").last().val(); i++) {
        if ($('#basedata' + i + 'CheckBox').prop('checked')) uBase += i + ",";
    }
    var uOpBase = $("#slider-1").val();

    var uPlan = "";
    for (var i = 0; i <= $(".list_item2").last().val(); i++) {
        if ($('#boundaries' + i + 'CheckBox').prop('checked')) uPlan += i + ",";
    }
    var uOpPlan = $("#slider-2").val();

    var uServices = "";
    for (var i = 0; i <= $(".list_item3").last().val(); i++) {
        if ($('#environmental' + i + 'CheckBox').prop('checked')) uServices += i + ",";
    }
    var uOpServices = $("#slider-3").val();

    var uInct = "";
    for (var i = 0; i <= $(".list_item4").last().val(); i++) {
        if ($('#place' + i + 'CheckBox').prop('checked')) uInct += i + ",";
    }
    var uOpInct = $("#slider-4").val();

    var uStWa = "";
    for (var i = 0; i <= $(".list_item5").last().val(); i++) {
        if ($('#stormWater' + i + 'CheckBox').prop('checked')) uInct += i + ",";
    }
    var uOpStWa = $("#slider-5").val();

    var uTran = "";
    for (var i = 0; i <= $(".list_item6").last().val(); i++) {
        if ($('#transportation' + i + 'CheckBox').prop('checked')) uInct += i + ",";
    }
    var uOpTran = $("#slider-6").val();

    var uWaWa = "";
    for (var i = 0; i <= $(".list_item7").last().val(); i++) {
        if ($('#wasteWater' + i + 'CheckBox').prop('checked')) uInct += i + ",";
    }
    var uOpWaWa = $("#slider-7").val();

    var uWater = "";
    for (var i = 0; i <= $(".list_item8").last().val(); i++) {
        if ($('#water' + i + 'CheckBox').prop('checked')) uInct += i + ",";
    }
    var uOpWater = $("#slider-8").val();

    var zoomLevel = app.map.getZoom();
    urlAdd = "?";
    urlAdd += "z=" + zoomLevel;
    var mapCenter = app.map.extent.getCenter();
    urlAdd += "&c=" + mapCenter.x + "," + mapCenter.y;

    urlAdd += "&layerBase=" + uBase + uOpBase + "&layerPlan=" + uPlan + uOpPlan + "&layerServices=" + uServices + uOpServices + "&layerIncentives=" + uInct + uOpInct + "&layer=" + uStWa + uOpStWa + "&layerIncentives=" + uTran + uOpTran + "&layerIncentives=" + uWaWa + uOpWaWa + "&layerIncentives=" + uWater + uOpWater;
    console.log(urlAdd);
}

//Toggle button - tools
$("#printLink").click(function() {
    //$("#print_button").toggle();
    if ($('#print_button').is(':visible')) {
        $('#print_button').hide("fast", "swing");
    } else {
        $('#print_button').show("fast", "swing");
        $('#btnGoogle').hide();
        $('#myText').hide();
        $('#btnIdentify').hide();
        $('#measurementDiv').hide();
    }
});
//End of Toggle button

function deleteList() {
    dojo.byId("featureCount").innerHTML = "";
    dojo.byId("leftPane").innerHTML = "";
}

function findRNO1(k) {
    var dirty = (new Date()).getTime();

    if (searchCategorySelected == "Search by Name") {
        selectedParcelGeometry = "";
        queryPa.where = "OWNER1 like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
        queryTaskPa.execute(queryPa, function(results) {
            showQueryResults1(results, k);
        });
    } else if (searchCategorySelected == "Search by State ID") {
        selectedParcelGeometry = "";
        queryPa.where = "STATEID like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
        queryTaskPa.execute(queryPa, function(results) {
            showQueryResults1(results, k);
        });
    } else if (searchCategorySelected == "Search by RNO") {
        var inputString;
        if (searchInput.substring(0, 1).toUpperCase() === "R") inputString = searchInput.toUpperCase();
        else inputString = "R" + searchInput.toUpperCase();
        selectedParcelGeometry = "";
        queryPa.where = " RNO  like '" + inputString + "%'" + " AND " + dirty + "=" + dirty;
        queryTaskPa.execute(queryPa, function(results) {
            showQueryResults1(results, k);
        });
    } else if (searchCategorySelected == "Search by RNO6") {
        var inputString;
        if (searchInput.substring(0, 1).toUpperCase() === "R") inputString = searchInput.toUpperCase();
        else inputString = "R" + searchInput.toUpperCase();
        selectedParcelGeometry = "";
        queryPa.where = " RNO6  like '" + inputString + "%'" + " AND " + dirty + "=" + dirty;
        queryTaskPa.execute(queryPa, function(results) {
            showQueryResults1(results, k);
        });
    } else if (searchCategorySelected == "Search by Subdivision") {
        selectedParcelGeometry = "";
        queryPa.where = "LEGAL like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
        queryTaskPa.execute(queryPa, function(results) {
            showQueryResults1(results, k);
        });
    } else if (searchCategorySelected == "Search by Business") {
        selectedParcelGeometry = "";
        queryBu.where = "BUSNAME like '%" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
        queryTaskBu.execute(queryBu, function(results) {
            showQueryResultsBu1(results, k);
        });
    }

}

function findRNO2(k) {
    var dirty = (new Date()).getTime();
    selectedParcelGeometry = "";

    //Search by RNO from address
    if (searchCategorySelected == "Search by RNO") {
        if (searchInput.substring(0, 1).toUpperCase() === "R") {
            queryA.where = "RNO like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
            queryTaskA.execute(queryA, function(resultsA) {
                showQueryResults2(resultsA, k);
            });
        } else {
            queryA.where = "RNO like 'R" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
            queryTaskA.execute(queryA, function(resultsA) {
                showQueryResults2(resultsA, k);
            });
        }
    }
    //search by RNO6 from address
    else if (searchCategorySelected == "Search by RNO6") {
        if (searchInput.substring(0, 1).toUpperCase() === "R") {
            queryA.where = "RNO6 like '" + searchInput.toUpperCase().substr(1, 6) + "%'" + " AND " + dirty + "=" + dirty;
            queryTaskA.execute(queryA, function(resultsA) {
                showQueryResults2(resultsA, k);
            });
        } else {
            queryA.where = "RNO6 like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
            queryTaskA.execute(queryA, function(resultsA) {
                showQueryResults2(resultsA, k);
            });
        }
    }
    //address search
    else {
        if (searchInput.indexOf(",") > -1) {
            var newSearchInput = searchInput.split(",");
            queryA.where = "STREET_NUM like '" + newSearchInput[0] + "%'" + " AND " + "STREET_NAME like '" + newSearchInput[1].trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
            queryTaskA.execute(queryA, function(results) {
                showQueryResults2(results, k);
            });
        }
        //search for intersection query
        else if (searchInput.indexOf("&") > -1) {} else {
            //search only for street name
            var newSearchInput = searchInput.split(" ");
            if (isInt(newSearchInput[0])) {

                if (newSearchInput[1]) var fInput = newSearchInput[1].toUpperCase();
                else var fInput = "nothing";
                //check if address input has direction with address number
                if (fInput === "E" || fInput === "N" || fInput === "NE" || fInput === "NW" || fInput === "S" || fInput === "SE" || fInput === "SW" || fInput === "W" || fInput === "nothing") {
                    queryA.where = "FULLADDR like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskA.execute(queryA, function(results) {
                        showQueryResults2(results, k);
                    });
                }
                //when address input does not have a direction
                else {
                    if (newSearchInput[2]) var streetTypeInout = newSearchInput[2];
                    else var streetTypeInout = "";
                    queryA.where = "STREET_NUM like '" + newSearchInput[0].trim() + "'" + " AND " + "STREET_NAME like '" + fInput.trim().toUpperCase() + "%'" + " AND STREET_TYPE like '" + streetTypeInout.trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskA.execute(queryA, function(results) {
                        showQueryResults2(results, k);
                    });
                }
            }

            //first entry is not a number
            else {
                var fInput = newSearchInput[0].toUpperCase();
                if (fInput === "E" || fInput === "N" || fInput === "NE" || fInput === "NW" || fInput === "S" || fInput === "SE" || fInput === "SW" || fInput === "W") {
                    if (newSearchInput[2]) var streetTypeInout = newSearchInput[2];
                    else var streetTypeInout = "";
                    queryA.where = "STREET_DIR like '" + fInput + "'" + " AND " + "STREET_NAME like '" + newSearchInput[1].trim().toUpperCase() + "%'" + " AND STREET_TYPE like '" + streetTypeInout.trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskA.execute(queryA, function(results) {
                        showQueryResults2(results, k);
                    });
                } else {
                    if (newSearchInput[1]) var streetTypeInout = newSearchInput[1];
                    else var streetTypeInout = "";
                    queryA.where = "STREET_NAME like '" + newSearchInput[0].trim().toUpperCase() + "%'" + " AND STREET_TYPE like '" + streetTypeInout.trim().toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
                    queryTaskA.execute(queryA, function(results) {
                        showQueryResults2(results, k);
                    });
                }
            }
        }
    }
}

function findRNO3(n) {
    //tenant search
    var queryTaskTe = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/AddressPts/MapServer/2");
    var queryTe = new esri.tasks.Query();
    queryTe.returnGeometry = false;
    queryTe.outFields = ["*"];

    var dirty = (new Date()).getTime();
    queryTe.where = "AGAETX like '" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;

    queryTaskTe.execute(queryTe, function(resultsTe2) {
        queryA.where = "LOCID = " + resultsTe2.features[n].attributes.AHAUCD + " AND " + dirty + "=" + dirty;
        queryTaskA.execute(queryA, function(resultsTeA) {
            if (resultsTeA.features.length == 1) {
                showQueryResultsA2(resultsTeA);
            } else {
                $("#featureCount").html("");
                $("#leftPane").html("<b>No matching current address or parcel record for this tenant was found.</b>");
                openRightPanelSTab();
            }
        });
    });
}

function showQueryResultsBu1(results, k) {
    var symbolPts = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([210, 105, 30, 0.5]), 8),
        new dojo.Color([210, 105, 30, 0.9])
    );
    app.map.graphics.clear();
    var graphicResults2 = results.features[k];
    graphicResults2.setSymbol(symbolPts);
    var attr = graphicResults2.attributes;

    app.map.graphics.add(graphicResults2);
    pointAnimate();

    //set zoom extent
    app.map.centerAndZoom(results.features[k].geometry, 8);

    //pass search results to the hauler query
    selectedParcelGeometry = results.features[k].geometry;

    //Census info
    var point = selectedParcelGeometry;
    var censusTractNo;
    queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
    queryC = new esri.tasks.Query();
    queryC.returnGeometry = true;
    queryC.outFields = ["*"];
    queryC.geometry = point;
    queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    queryTaskC.execute(queryC, function(resultsC) {
        //console.log("census query results: " + resultsC.features.length);
        if (resultsC.features.length === 1) {
            var graphicC = resultsC.features[0];
            var attrC = graphicC.attributes;
            censusTractNo = attrC.TRACT;

            var newRNO = attr.RNO.replace("R", "");
            var busOpenDateBu = new Date(attr.OPENED);
            var busOpenDate = busOpenDateBu.toLocaleString();
            var infoContentAddr = "";
            infoContentAddr = '<div class="tab-pane active" id="searchResultsInfoW"><div class="panel-group" id="accordionSearch"><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseOneSearch">Business Information</a></h4></div><div id="collapseOneSearch" class="panel-collapse collapse in"><div class="panel-body"><table id="pi"><tr><td>Business Name</td><td>' + attr.BUSNAME + '</td></tr><tr><td>RNO</td><td>' + attr.RNO + '</td></tr><tr><td>Address</td><td>' + attr.ADDRESS + '</td></tr><tr><td>City/Zip</td><td>' + attr.City + '&nbsp;' + attr.State + '&nbsp;' + attr.Zip_Code + '</td></tr><tr><td>Mailing Address</td><td>' + attr.MAILING + '&nbsp;' + attr.MAILING2 + '</td></tr><tr><td>Mail City/Zip</td><td>' + attr.MAILCITY + '&nbsp;' + attr.MAILSTATE + '&nbsp;' + attr.MAILZIP + '</td></tr><tr><td>Phone</td><td>' + attr.PHONE + '</td></tr><tr><td>NAICS Code</td><td>' + attr.NAICS_Code + '</td></tr><tr><td>Business Type</td><td>' + attr.NAICSDESC + '</td></tr><tr><td>License</td><td>' + attr.License + '</td></tr><tr><td>Number of Employees</td><td>' + attr.EMPLOYEES + '</td></tr><tr><td>Open Date</td><td>' + busOpenDate + '</td></tr></table></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseTwoSearch">SunGard/HTE Information</a></h4></div><div id="collapseTwoSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="http://leia/asp/greshamgis/arcims_process_edit3.asp?IDValue=' + newRNO + '" frameborder="0" width="100%" height="500px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseFiveSearch">Notes</a></h4></div><div id="collapseFiveSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="http://leia/asp/greshamgis/parcel_view.asp?rno=' + newRNO + '" frameborder="0" width="100%" height="500px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseThreeSearch">District Information from METRO</a></h4></div><div id="collapseThreeSearch" class="panel-collapse collapse"><div class="panel-body"><iframe src="metroreport.html?ID=' + attr.ADDRESS + '" frameborder="0" width="100%" height="600px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapsefourSearch">More information from County</a></h4></div><div id="collapsefourSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="parcelreport.html?ID=' + attr.RNO + '"  frameborder="0" width="100%" height="480px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapsefiveSearch">Census information</a></h4></div><div id="collapsefiveSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="censusreport.html?TRACT=' + censusTractNo + '"  frameborder="0" width="100%" height="520px"></iframe></div></div></div></div></div></div>';

            dojo.byId("leftPane").innerHTML = infoContentAddr;
            dojo.byId("featureCount").innerHTML = "";
            openRightPanelSTab();
        }
    });

}

function findParcel(fullAddr, rno, rno6, stateId, city, zip, censusTractNo, addressStatus) {
    var infoContentAddr = ""; 
    var dirty = (new Date()).getTime();

    queryPa.where = "RNO like '" + rno + "%'" + " AND " + dirty + "=" + dirty;
    queryTaskPa.execute(queryPa, function(resultsP) {
        if (resultsP.features.length < 1) {
            var newRNO = rno.replace("R", "");
            var stateIDfirst = stateId.split(" ")[0];
            var newState_ID = "<a href='http://www4.multco.us/surveyimages/dist/assr/out/" + stateIDfirst + ".pdf' onclick='window.open(this.href," + '"' + "window" + '"' + ',' + '"' + 'resizable,scrollbars,titlebar=no' + '"' + ");return false;'>Link</a>";
            infoContentAddr = '<div class="tab-pane active" id="searchResultsInfoW"><div class="panel-group" id="accordionSearch"><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseOneSearch">TAXLOT Information</a><a href="parcelreportprint.html?ID=' + rno + '" target="_blank"><span class="glyphicon glyphicon-print" style="float:right"></span></a></h4></div><div id="collapseOneSearch" class="panel-collapse collapse in"><div class="panel-body"><table id="pi"><tr><td>StateID</td><td>' + stateId + '</td></tr><tr><td>RNO</td><td>' + rno + '</td></tr><tr><td>PropID</td><td>' + rno6 + '</td></tr><tr><td>Address</td><td>' + fullAddr + ' <b>' + addressStatus + '</b></td></tr><tr><td>City/Zip</td><td>' + city + '&nbsp;OR&nbsp;' + zip + '</td></tr><tr><td>Owner</td><td>No ownership records found</td></tr><tr><td>Tax Plat</td><td>' + newState_ID + '</td></tr></table></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseTwoSearch">SunGard/HTE Information</a></h4></div><div id="collapseTwoSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="http://leia/asp/greshamgis/arcims_process_edit3.asp?IDValue=' + newRNO + '" frameborder="0" width="100%" height="500px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseFiveSearch">Notes</a></h4></div><div id="collapseFiveSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="http://leia/asp/greshamgis/parcel_view.asp?rno=' + newRNO + '" frameborder="0" width="100%" height="500px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseThreeSearch">District Information from METRO</a></h4></div><div id="collapseThreeSearch" class="panel-collapse collapse"><div class="panel-body"><iframe src="metroreport.html?ID=' + fullAddr + '" frameborder="0" width="100%" height="600px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapsefourSearch">More information from County</a></h4></div><div id="collapsefourSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="parcelreport.html?ID=' + rno + '"  frameborder="0" width="100%" height="480px"></iframe></div></div></div><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapsefiveSearch">Census information</a></h4></div><div id="collapsefiveSearch" class="panel-collapse collapse"><div class="panel-body"><iframe class="embed-responsive-item" src="censusreport.html?TRACT=' + censusTractNo + '"  frameborder="0" width="100%" height="520px"></iframe></div></div></div></div></div>';
        } else {
            for (var i = 0; i < resultsP.features.length; i++) {
                var graphic = resultsP.features[i];

                var attr = graphic.attributes;
                attr.newRNO = attr.RNO.replace("R", "");
                attr.censusTractNo = censusTractNo;
                var stateIDfirst = attr.STATEID.split(" ")[0];
                attr.newState_ID = "<a href='http://www4.multco.us/surveyimages/dist/assr/out/" + stateIDfirst + ".pdf' onclick='window.open(this.href," + '"' + "window" + '"' + ',' + '"' + 'resizable,scrollbars,titlebar=no' + '"' + ");return false;'>Link</a>";

                var content2 = app.parcelTemplate({attr:attr});
                infoContentAddr += content2;
            }
        }

        dojo.byId("leftPane").innerHTML = infoContentAddr;
    });
    dojo.byId("featureCount").innerHTML = "";
    openRightPanelSTab();
}

function findMH(k) {
    queryTaskMH = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/gview2/WasteWater/MapServer/0");
    queryMH = new esri.tasks.Query();
    queryMH.returnGeometry = true;
    queryMH.outFields = ["*"];
    var dirty = (new Date()).getTime();

    queryMH.where = "ID like '%" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
    queryTaskMH.execute(queryMH, function(results) {
        showQueryResultsMH1(results, k);
    });
}


function showQueryResultsMH1(resultsMH, k) {
    var symbolQueryMH = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([210, 105, 30, 0.5]), 8),
        new dojo.Color([210, 105, 30, 0.9])
    );

    app.map.graphics.clear();
    var infoContent = "";
    var addrContent = "";
    var addrContentTe = "";
    dojo.byId("featureCount").innerHTML = "";

    var graphicMH = resultsMH.features[k];
    graphicMH.setSymbol(symbolQueryMH);

    var attr = graphicMH.attributes;
    //check parcel number, owner, and address
    var content = '<div class="tab-pane active" id="searchResultsInfoW"><div class="panel-group" id="accordionSearch"><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseOneSearch">Manhole Information</a></h4></div><div id="collapseOneSearch" class="panel-collapse collapse in"><div class="panel-body"><table id="pi"><tr><td>ID</td><td>' + attr.ID + '</td></tr><tr><td>Type</td><td>' + attr.TYPE + '</td></tr><tr><td>Map No.</td><td>' + attr.MAPNO + '</td></tr><tr><td>Basin</td><td>' + attr.BASIN + '</td></tr><tr><td>Manhole Number</td><td>' + attr.MHNUM + '</td></tr><tr><td>Status</td><td>' + attr.Status + '</td></tr><tr><td>Owner</td><td>' + attr.Owner + '</td></tr><tr><td>Comments</td><td>' + attr.Comments + '</td></tr><tr><td>Off Road</td><td>' + attr.Offroad + '</td></tr><tr><td>Asbuilt Year</td><td>' + attr.YR_ASBLT + '</td></tr><tr><td>RIM</td><td>' + attr.RIM + '</td></tr><tr><td>Elevation Out</td><td>' + attr.ELVOUT + '</td></tr><tr><td>Elevation In</td><td>' + attr.ELVINDS + '</td></tr></table></div></div></div></div></div></div>';

    infoContent += content; 
    app.map.graphics.add(graphicMH);

    selectedParcelGeometry = resultsMH.features[k].geometry;

    dojo.byId("leftPane").innerHTML = infoContent;
    dojo.byId("featureCount").innerHTML = "";

    //set zoom extent 
    app.map.centerAndZoom(resultsMH.features[k].geometry, 8);
    openRightPanelSTab();

}

function findSD(k) {
    queryTaskSD = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/gview2/GVII/MapServer/26");
    querySD = new esri.tasks.Query();
    querySD.returnGeometry = true;
    querySD.outFields = ["*"];
    var dirty = (new Date()).getTime();

    querySD.where = "LEGAL like '%" + searchInput.toUpperCase() + "%'" + " AND " + dirty + "=" + dirty;
    queryTaskSD.execute(querySD, function(results) {
        showQueryResultsSD1(results, k);
    });
}

function showQueryResultsSD1(resultsSD, k) {
    var symbolQuerySD = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SHORTDASH, new dojo.Color([255, 0, 0]), 3), new dojo.Color([255, 255, 0]));

    app.map.graphics.clear();
    var infoContent = "";
    var addrContent = "";
    var addrContentTe = "";
    dojo.byId("featureCount").innerHTML = "";

    var graphicSD = resultsSD.features[k];
    graphicSD.setSymbol(symbolQuerySD);

    var attr = graphicSD.attributes;
    var folderLo = attr.Folder;
    var folderLoLink = folderLo.replace(/\\/g, "/");

    //check parcel number, owner, and address
    var content = '<div class="tab-pane active" id="searchResultsInfoW"><div class="panel-group" id="accordionSearch"><div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" href="#collapseOneSearch">Subdivision Information</a></h4></div><div id="collapseOneSearch" class="panel-collapse collapse in"><div class="panel-body"><table id="pi"><tr><td>Name</td><td>' + attr.LEGAL + '</td></tr><tr><td>Type</td><td>' + attr.TYPE + '</td></tr><tr><td>Folder</td><td><a href="file://' + folderLoLink + '" target="_blank" alt="folder Location">' + attr.Folder + '</a></td></tr></table></div></div></div></div></div></div>';

    infoContent += content;
    //console.log(content);        
    app.map.graphics.add(graphicSD);

    selectedParcelGeometry = resultsSD.features[k].geometry;

    dojo.byId("leftPane").innerHTML = infoContent;
    dojo.byId("featureCount").innerHTML = "";

    //set zoom extent
    var selectedExtent = resultsSD.features[k].geometry.getExtent();
    app.map.setExtent(selectedExtent);

    openRightPanelSTab();
}

function showQueryResults1(results, k) {
    var content = "";
    var symbolResults1 = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SHORTDASH, new dojo.Color([255, 0, 0]), 3), new dojo.Color([255, 255, 0]));
    app.map.graphics.clear();
    var addrContent = "";
    var graphicResults1 = results.features[k];
    graphicResults1.setSymbol(symbolResults1);

    //Census info
    var point = graphicResults1.geometry;
    var censusTractNo;
    queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
    queryC = new esri.tasks.Query();
    queryC.returnGeometry = true;
    queryC.outFields = ["*"];
    queryC.geometry = point;
    queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    queryTaskC.execute(queryC, function(resultsC) {
        if (resultsC.features.length === 1) {
            var graphicC = resultsC.features[0];
           

            var attr = graphicResults1.attributes;
            var attrC = graphicC.attributes;
            attr.censusTractNo = attrC.TRACT;
            attr.newRNO = attr.RNO.replace("R", "");
            var stateIDfirst = attr.STATEID.split(" ")[0];
            attr.newState_ID = "<a href='http://www4.multco.us/surveyimages/dist/assr/out/" + stateIDfirst + ".pdf' onclick='window.open(this.href," + '"' + "window" + '"' + ',' + '"' + 'resizable,scrollbars,titlebar=no' + '"' + ");return false;'>Link</a>";
            //check parcel number, owner, and address
            var content = app.parcelTemplate({attr:attr});

            //infoContentSub += content;      
            app.map.graphics.add(graphicResults1);

            //set zoom extent
            var selectedExtent = results.features[k].geometry.getExtent();
            app.map.setExtent(selectedExtent);

            //pass search results to the hauler query
            selectedParcelGeometry = results.features[k].geometry;

            dojo.byId("leftPane").innerHTML = content;
            dojo.byId("featureCount").innerHTML = "";
            openRightPanelSTab();

        }
    });
}

function showQueryResults2(results, k) {
    var symbolPts = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([210, 105, 30, 0.5]), 8),
        new dojo.Color([210, 105, 30, 0.9])
    );
    app.map.graphics.clear();
    var graphicResults2 = results.features[k];
    graphicResults2.setSymbol(symbolPts);
    var attr = graphicResults2.attributes;
    var address2Streetaddr = attr.FULLADDR;
    var address2RNO = attr.RNO;
    var address2RNO6 = attr.RNO6;
    var address2Stateid = attr.STATEID;
    var address2City = attr.CITY;
    var address2Zip = attr.ZIPCODE;
    var address2Status = attr.ADDRSTATUS;
    var addr2Status = "";
    if (address2Status) {
        if (address2Status == "I") addr2Status = "Inactive";
        else if (address2Status == "D") addr2Status = "Demolished";
        else if (address2Status == "T") addr2Status = "Temporary";
    }

    app.map.graphics.add(graphicResults2);
    pointAnimate();

    //set zoom extent
    app.map.centerAndZoom(results.features[k].geometry, 8);

    //pass search results to the hauler query
    selectedParcelGeometry = results.features[k].geometry;

    //Census info
    var point = selectedParcelGeometry;
    var censusTractNo;
    queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
    queryC = new esri.tasks.Query();
    queryC.returnGeometry = true;
    queryC.outFields = ["*"];
    queryC.geometry = point;
    queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    queryTaskC.execute(queryC, function(resultsC) {
        //console.log("census query results: " + resultsC.features.length);
        if (resultsC.features.length === 1) {
            var graphicC = resultsC.features[0];
            var attrC = graphicC.attributes;
            censusTractNo = attrC.TRACT;

            findParcel(address2Streetaddr, address2RNO, address2RNO6, address2Stateid, address2City, address2Zip, censusTractNo, addr2Status);

        }
    });
}

function showQueryResultsA2(results) {
    //set search results polygon symbol
    var symbolPts = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([210, 105, 30, 0.5]), 8),
        new dojo.Color([210, 105, 30, 0.9])
    );
    app.map.graphics.clear();
    var infoContent = "";
    var addrContent = "";
    if (results.features.length < 1) {
        infoContent = "<br />No matching record was found in the map layer. If you are searching for an old property, you may find it in the HTE land database system. Click '<b>Search HTE Database</b>' button below. <br /><button onclick='javascript:hteSearch();' class='btnSubmit' data-role='button' id='btnHTE' data-mini='true' data-theme='b' data-corners='true' style='width:100%; min-height::35px;margin:5px;border-radius:15px;'>Search HTE Database</button>";
        dom.byId("featureCount").innerHTML = "";
        dom.byId("leftPane").innerHTML = infoContent;
        openRightPanelSTab();
    } else if (results.features.length > 1) {
        dojo.byId("leftPane").innerHTML = "";
        addrContent += '<ul>';
        for (var k = 0; k < results.features.length; k++) {
            var graphic1 = results.features[k];
            var attr1 = graphic1.attributes;
            var searchRList = "";
            searchRList = "Address: " + attr1.FULLADDR;
            var content1 = "<li><a href='javascript:findRNO2(" + k + "),deleteList()'>" + searchRList + "</a></li>";
            addrContent += content1;
        }
        addrContent += '</ul>';
        var addrCount = "<div>" + "We found " + results.features.length.toString() + " matches.<br /></div>";
        dom.byId("featureCount").innerHTML = "";
        dom.byId("leftPane").innerHTML = addrCount + addrContent;
        openRightPanelSTab();
    } else {
        dojo.byId("featureCount").innerHTML = "";
        var graphic = results.features[0];
        graphic.setSymbol(symbolPts);
        var attr = graphic.attributes;
        var addressStreetaddr = attr.FULLADDR;
        var addressRNO = attr.RNO;
        var addressRNO6 = attr.RNO6;
        var addressStateid = attr.STATEID;
        var addressCity = attr.CITY;
        var addressZip = attr.ZIPCODE;
        var address2Status = attr.ADDRSTATUS;
        var addr2Status = "";
        if (address2Status) {
            if (address2Status == "I") addr2Status = "Inactive";
            else if (address2Status == "D") addr2Status = "Demolished";
            else if (address2Status == "T") addr2Status = "Temporary";
        }

        app.map.graphics.add(graphic);
        pointAnimate()
            //Census info
        var point = graphic.geometry;
        var censusTractNo;
        queryTaskC = new esri.tasks.QueryTask("http://maps.greshamoregon.gov/arcgis/rest/services/Parcel/Census/MapServer/0");
        queryC = new esri.tasks.Query();
        queryC.returnGeometry = true;
        queryC.outFields = ["*"];
        queryC.geometry = point;
        queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
        queryTaskC.execute(queryC, function(resultsC) {
            //console.log("census query results: " + resultsC.features.length);
            if (resultsC.features.length === 1) {
                var graphicC = resultsC.features[0];
                var attrC = graphicC.attributes;
                censusTractNo = attrC.TRACT;
                //End of Census info

                selectedParcelGeometry = results.features[0].geometry;
                findParcel(addressStreetaddr, addressRNO, addressRNO6, addressStateid, addressCity, addressZip, censusTractNo, addr2Status);

            }
        });
        app.map.centerAndZoom(results.features[0].geometry, 8);
    }
}

function hteSearch() {
    if (searchCategorySelected == "Search by Address") {
        var addrDiv = searchInput.split(" ");
        var addrNum = addrDiv[0];
        var addrStr = "";
        if (addrDiv[2]) var addrStr = addrDiv[2];
        window.open("http://leia/asp/greshamgis/address_process_js1.asp?stno=" + addrNum + "&stname=" + addrStr, "window", "width=460, height=580, resizable, scrollbars, titlebar=no");
    } else if (searchCategorySelected == "Search by Name") {
        window.open("http://leia/asp/greshamgis/owner_process_js1.asp?owner=" + searchInput, "window", "width=460, height=580, resizable, scrollbars, titlebar=no");
    } else if (searchCategorySelected == "Search by RNO") {
        window.open("http://leia/asp/greshamgis/parcel_id_process_js1.asp?Rno=" + searchInput, "window", "width=460, height=580, resizable, scrollbars, titlebar=no");
    } else if (searchCategorySelected == "Search by RNO6") {
        window.open("http://leia/asp/greshamgis/parcel_id_process_js1.asp?Rno=" + searchInput, "window", "width=460, height=580, resizable, scrollbars, titlebar=no");
    } else if (searchCategorySelected == "Search by State ID") {
        window.open("http://leia/asp/greshamgis/stateid_process_js1.asp?stateid=" + searchInput, "window", "width=460, height=580, resizable, scrollbars, titlebar=no");
    } else {
        window.open("http://leia/asp/greshamgis/parcel_id_process_js1.asp?Rno=0000000", "window", "width=460, height=580, resizable, scrollbars, titlebar=no");
    }
}

function pointAnimate() {
    $("circle").css("opacity", 1);
    $("circle").animate({
        opacity: 0.1
    }, 3000, pointAnimate);
}

function resizeMap() {
    if (($(window).width()) < 992 && ($("#rightC").hasClass("col-md-4"))) {
        $('#map').height($(window).height() - $('#navbarHeader').height() - 300);
    } else {
        $('#map').height($(window).height() - 50);
    }
    app.map.resize();
    app.map.reposition();
}

function resizeIcons() {
    if (($(window).width()) < 1167 && ($(window).width()) > 750) {
        $("#helpLink").html('<span class="glyphicon glyphicon-question-sign"></span>');
        $("#printLink").html('<span class="glyphicon glyphicon-print"></span>');
        $("#streetViewLink").html('<span class="glyphicon glyphicon-picture"></span>');
        $("#identifyLink").html('<span class="glyphicon glyphicon-info-sign"></span>');
        $("#measureLink").html('<span class="glyphicon glyphicon-resize-horizontal"></span>');
        $("#searchInput .ui-input-text .inputText").css("width", "220px");
        $("div.navbar-form.navbar-right").css("width", "380px");
        $("div.form-group").css("width", "380px");
        $("#btnGoogle").css("left", "277px");
        $("#myText").css("left", "300px");
        $("#btnIdentify").css("left", "332px");
        $("#measurementDiv").css("left", "350px");
    } else {
        $("#helpLink").html('<span class="glyphicon glyphicon-question-sign"></span> Help');
        $("#printLink").html('<span class="glyphicon glyphicon-print"></span> Print');
        $("#streetViewLink").html('<span class="glyphicon glyphicon-picture"></span> Street View');
        $("#identifyLink").html('<span class="glyphicon glyphicon-info-sign"></span> Identify');
        $("#measureLink").html('<span class="glyphicon glyphicon-resize-horizontal"></span> Measure');
        $("#searchInput .ui-input-text .inputText").css("width", "320px");
        $("div.navbar-form.navbar-right").css("width", "500px");
        $("div.form-group").css("width", "500px");
        $("#btnGoogle").css("left", "380px");
        $("#myText").css("left", "450px");
        $("#btnIdentify").css("left", "482px");
        $("#measurementDiv").css("left", "550px");
    }
}

$(".navbar-toggle").click(function(event) {
    $(".navbar-collapse").toggle('in');
});