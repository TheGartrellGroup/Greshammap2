app.initializeStreetView = function() {

        require(["dojo/on","esri/SpatialReference", "esri/graphic"], function(on, SpatialReference, Graphic) {

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
                        console.log('here')
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

            console.log("done")

        })
    }