app.initializeGeocoder = function(){

     require(["esri/dijit/Geocoder"], function(Geocoder, SimpleFillSymbol, SimpleLineSymbol, Color){

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

        function pointAnimate() {
            $("circle").css("opacity", 1);
            $("circle").animate({
                opacity: 0.1
            }, 3000, pointAnimate);
        }
    });
    };