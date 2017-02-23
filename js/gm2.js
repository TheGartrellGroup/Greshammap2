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
var loading;
var legend;
var featureLayer;
var gsvClick, infowiClick, idfClick;
var geoGraphic;
var parcelResults, xID, symbolIdentifyPoint, symbolIdentifyPolyline, symbolIdentifyPolygon, identifyTask, identifyParameters, identifyParams, identifyValue, identifyText, searchCategorySelected, selectedParcelGeometry, measurement, showQueryResultsInt;
var app = {};
var selectionToolbar;
var streetMap, parcelLines, cityStreetParcel, aerialMap2015, aerialMap2014, aerialMap2013, aerialMap2012, aerialMap2007, aerialMap2002, aerialMap;
var layerBaseData, layerBoundaries, layerEnvironmental, layerPlace, layerStormwater, layerTransportation, layerWastewater, layerWater;
var opacityA

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
    "esri/dijit/Legend", "esri/dijit/Popup", "esri/dijit/HomeButton", "esri/dijit/LocateButton", "esri/geometry/Extent",

    "esri/tasks/locator", "esri/graphic", "esri/InfoTemplate", "esri/symbols/SimpleMarkerSymbol", "esri/tasks/GeometryService", "esri/SpatialReference",
    "esri/geometry/Point", "esri/geometry", "esri/request", "esri/config",
    "esri/dijit/Print", "esri/tasks/PrintTemplate", "esri/tasks/PrintTask", "esri/tasks/LegendLayer",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", "esri/Color",
     "esri/symbols/Font",
   "esri/dijit/Scalebar", 
    "dojo/dom", "dojo/dom-construct", "dojo/dom-style",
    "dojo/query", "dojo/on",
    "dojo/parser", "dojo/_base/array", "dojo/dnd/Source", "dijit/registry", "dojo/_base/connect","dojo/promise/all",
    "dijit/form/Button",

    "dojo/domReady!"
], function(Map, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer, GraphicsLayer, FeatureLayer, ImageParameters, DynamicLayerInfo, LayerDataSource,
    LayerDrawingOptions, Legend, Popup,  HomeButton, LocateButton, Extent,
    Locator, Graphic, InfoTemplate, SimpleMarkerSymbol, GeometryService, SpatialReference, Point, Geometry, esriRequest, esriConfig, Print, PrintTemplate, PrintTask, LegendLayer,
    SimpleFillSymbol, SimpleLineSymbol, IdentifyTask, IdentifyParameters, Color, Font,  Scalebar, 
    dom, domConstruct, domStyle, query, on, parser, arrayUtils, Source, registry, connect, all) {

    parser.parse();

    parseOnLoad = "false";

    app.printUrl = "http://leia/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";

    esriConfig.defaults.io.proxyUrl = "http://localhost/proxy/proxy.ashx";
    esriConfig.defaults.io.alwaysUseProxy = true;
    esriConfig.defaults.geometryService = new GeometryService("http://www.gartrellgroup.net/arcgis/rest/services/Utilities/Geometry/GeometryServer");
	
    var map, usaLayer, dynamicLayerInfos;
    var infos = {};

    $.get('views/parcelTemplate.htm').then(function(template){
        app.parcelTemplate = UnderscoreTemplate(template);
    })

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

    if (QueryString.map) {

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
        
        loading = dom.byId("loadingImg");

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

        on(app.map, "update-start",  function(){esri.show(dom.byId("loadingImg"))});
        on(app.map, "update-end",  function(){esri.hide(dom.byId("loadingImg"))});

        var home = new HomeButton({
            map: app.map
        }, "HomeButton");
        home.startup();

        var scalebar = new Scalebar({
            map: app.map,
            attachTo: "bottom-left",
            scalebarUnit: "dual"
        });

        streetMap = new ArcGISTiledMapServiceLayer("http://leia/arcgis/rest/services/gview/BaseMap/MapServer");
        
        parcelLines = new esri.layers.ArcGISTiledMapServiceLayer("http://leia/arcgis/rest/services/gview/ParcelLines/MapServer");
        cityStreetParcel = new esri.layers.ArcGISDynamicMapServiceLayer("http://leia/arcgis/rest/services/gview/CityStreetParcel/MapServer");
        aerialMap2015 = new esri.layers.ArcGISTiledMapServiceLayer("http://maps.greshamoregon.gov/arcgis/rest/services/gview/AerialCacheNew/MapServer");
        aerialMap2014 = new esri.layers.ArcGISTiledMapServiceLayer("http://leia/arcgis/rest/services/gview/AerialCache/MapServer");
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

            return layer
        }

        layerBaseData = createImageParams(layerBaseData, "http://leia/arcgis/rest/services/gview2/BaseData/MapServer", 'layerBaseData');
        layerBoundaries = createImageParams(layerBoundaries, "http://leia/arcgis/rest/services/gview2/Boundaries/MapServer", 'layerBoundaries');
        layerEnvironmental = createImageParams(layerEnvironmental, "http://leia/arcgis/rest/services/gview2/Environmental/MapServer", 'layerEnvironmental');
        layerPlace=createImageParams(layerPlace, "http://leia/arcgis/rest/services/gview2/Place/MapServer", 'layerPlace');
        layerStormwater=createImageParams(layerStormwater, "http://leia/arcgis/rest/services/gview2/StormWater/MapServer", 'layerStormwater');
        layerTransportation=createImageParams(layerTransportation, "http://leia/arcgis/rest/services/gview2/Transportation/MapServer", 'layerTransportation');
        layerWastewater=createImageParams(layerWastewater, "http://leia/arcgis/rest/services/gview2/WasteWater/MapServer", 'layerWastewater');
        layerWater=createImageParams(layerWater, "http://leia/arcgis/rest/services/gview2/Water/MapServer", 'layerWater');

        app.map.addLayers([streetMap, parcelLines, layerBaseData, layerBoundaries, layerEnvironmental, layerPlace, layerStormwater, layerTransportation, layerWastewater, layerWater]);
        

        //Legend
        legend = new Legend({
            map: app.map,
            respectCurrentMapScale: true,
            layerInfos: [{
                layer: layerBaseData
            }
            , {
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
            }
            ]
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

        mapClickEvent = on(app.map, "click", function(evt) {
            app.showLocation(evt);
        });

        //Define Queries
        queryTaskPa = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/EastCountyParcels/MapServer/0");
        queryPa = new esri.tasks.Query();
		queryPa.returnGeometry=true;
		queryPa.outFields = ["*"];
		
        // //define queries
        queryTaskA = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/AddressPts/MapServer/1");
        queryA = new esri.tasks.Query();
		queryA.returnGeometry=true;
		queryA.outFields = ["*"];

        //End of Define Queries

        app.initializeSelection(); //calls code in selection.js

        app.initializeLayerList(); //calls code in layerList.js

        app.initializeStreetView(); //calls code in googleStreetView.js

        app.initializeMeasurement(); //calls code in measurement.js
    
        //app.initializeGeocoder(); //calls code in geocoder.js
        //is this code used?

        app.initializeIdentify(); //calls code in identify.js
        //how much of identify code is necessary?

        app.initializeSearch(); //calls code in search.js

        //Resize window
        $(window).resize(function() {
            resizeMap();
            resizeIcons();
        });
        resizeMap();
        resizeIcons();

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

        $('.toc_item').on('change', function(){

            var list_number = $(this).attr('class').replace('toc_item','').trim();

            visibleLayerIds = [];

            var layers = $('.'+list_number);

            for(var i=0;i<layers.length;i++){

                if(layers[i].checked){
                     if (layers[i].value === '9,10,11') {
                        visibleLayerIds.push(9);
                        visibleLayerIds.push(10);
                        visibleLayerIds.push(11);
                    } else {
                        visibleLayerIds.push(layers[i].value);
                    }
                }

            }

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
 
            $('.toc_item').removeAttr("checked");

            if ($(".beforecheck").hasClass("ui-checkbox-on")) {
                $(".beforecheck").removeClass("ui-checkbox-on");
                $(".beforecheck").addClass("ui-checkbox-off");
            }

            $("#slider-1,#slider-2,#slider-3,#slider-4,#slider-5,#slider-6,#slider-7,#slider-8").val(0.5);
            $("#slider-1,#slider-2,#slider-3,#slider-4,#slider-5,#slider-6,#slider-7,#slider-8").slider('refresh');
        });
        //End of Delete all layers function

        //delete all selections and drawings
        $("#btnDeleteSelection").on("click", function() {
            app.map.graphics.clear();
        });

        $('#btnToggleSelectable').on('click', function(){
            $('.aftercheck.ui-checkbox-on').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
            $('.selBox').removeAttr('checked');
        });

        $(function () {
          $('[data-toggle="popover"]').popover()
        })

        $('.aftercheck').attr('title', 'Make selectable');
        $('.beforecheck').attr('title', 'Toggle Visibility');

        $.get('views/exportModal.htm').then(function(template){

            app.exportTemplate = UnderscoreTemplate(template);

            $('body').append(app.exportTemplate)

            app.export.init(); //calls code in print.js
        })

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
    gsvc = new esri.tasks.GeometryService("http://leia/ArcGIS/rest/services/Utilities/Geometry/GeometryServer");
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
function getMapState() {
   var uBase = "";
    for (var i = 0; i <= $(".list_item1").last().val(); i++) {
        if ($('#basedata' + i + 'CheckBox').prop('checked')) uBase += i + ",";
    }
    var uOpBase = $("#slider-1").val();
 
    var uBoundary = "";
    for (var i = 0; i <= $(".list_item2").last().val(); i++) {
        if ($('#boundaries' + i + 'CheckBox').prop('checked')) uBoundary += i + ",";
    }
    var uOpBoundary = $("#slider-2").val();
 
    var uEnv = "";
    for (var i = 0; i <= $(".list_item3").last().val(); i++) {
        if ($('#environmental' + i + 'CheckBox').prop('checked')) uEnv += i + ",";
    }
    var uOpEnv = $("#slider-3").val();
 
    var uPlace = "";
    for (var i = 0; i <= $(".list_item4").last().val(); i++) {
        if ($('#place' + i + 'CheckBox').prop('checked')) uPlace += i + ",";
    }
    var uOpPlace = $("#slider-4").val();
 
    var uStWa = "";
    for (var i = 0; i <= $(".list_item5").last().val(); i++) {
        if ($('#stormWater' + i + 'CheckBox').prop('checked')) uStWa += i + ",";
    }
    var uOpStWa = $("#slider-5").val();
 
    var uTran = "";
    for (var i = 0; i <= $(".list_item6").last().val(); i++) {
        if ($('#transportation' + i + 'CheckBox').prop('checked')) uTran += i + ",";
    }
    var uOpTran = $("#slider-6").val();
 
    var uWaWa = "";
    for (var i = 0; i <= $(".list_item7").last().val(); i++) {
        if ($('#wasteWater' + i + 'CheckBox').prop('checked')) uWaWa += i + ",";
    }
    var uOpWaWa = $("#slider-7").val();
 
    var uWater = "";
    for (var i = 0; i <= $(".list_item8").last().val(); i++) {
        if ($('#water' + i + 'CheckBox').prop('checked')) uWater += i + ",";
    }
    var uOpWater = $("#slider-8").val();
 
    var zoomLevel = app.map.getZoom();
    urlAdd = "?";
    urlAdd += "z=" + zoomLevel;
    var mapCenter = app.map.extent.getCenter();
    urlAdd += "&c=" + mapCenter.x + "," + mapCenter.y;
 
    urlAdd += "&layerBaseData=" + uBase + uOpBase + "&layerBoundaries=" + uBoundary + uOpBoundary + "&layerPlace=" + uPlace + uOpPlace +"&layerEnvironmental=" + uEnv + uOpEnv + "&layerStormwater=" + uStWa + uOpStWa + "&layerTransportation=" + uTran + uOpTran + "&layerWastewater=" + uWaWa + uOpWaWa + "&layerWater=" + uWater + uOpWater;
    console.log(urlAdd)
}


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
    queryTaskC = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/Census/MapServer/0");
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
	debugger
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
    queryTaskC = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/Census/MapServer/0");
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
    queryTaskC = new esri.tasks.QueryTask("http:/leia/arcgis/rest/services/Parcel/Census/MapServer/0");
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
        queryTaskC = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/Census/MapServer/0");
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