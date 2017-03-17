app.initializeIdentify = function(){

	require(["dojo/on","esri/SpatialReference", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color", "esri/graphic", "dojo/dom"], function(on,SpatialReference, SimpleFillSymbol, SimpleLineSymbol, Color, Graphic, dom){

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

     var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([210, 105, 30, 0.5]), 8),
        new dojo.Color([210, 105, 30, 0.9])
    );

    var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 3), new Color([255, 255, 0]));

    app.showLocation = function(evt) {

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
			queryC.outSpatialReference = new SpatialReference({wkid:2913})
            queryC.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
            queryTaskC.execute(queryC, function(resultsC) {
                if (resultsC.features.length === 1) {
                    var graphicC = resultsC.features[0];
                    var attrC = graphicC.attributes;
                    censusTractNo = attrC.TRACT;

                    //End of Census info

                    queryTaskP = new esri.tasks.QueryTask("http://leia/arcgis/rest/services/Parcel/EastCountyParcels/MapServer/0");
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

    //     $(".identifyDropdownList.dropdown-menu li a").click(function() {
    //         identifyValue = $(this).data('value');
    //         identifyText = $(this).text();
    //         $("#btnIdentify").trigger("click");
    //     });

    //     $("#identifyLink").click(function() {
    //         if ($('#myText').is(':visible')) {
    //             $('#myText').hide("fast", "swing");
    //             $('#btnIdentify').hide("fast", "swing");
    //             dojo.disconnect(idfClick);
    //             dojo.byId("map_layers").style.cursor = "default";
				// mapClickEvent.remove();
				// dojo.disconnect(mapClickEvent);
    //             mapClickEvent = on(app.map, "click", function(evt) {
    //                 showLocation(evt);
    //             });
    //         } else {
    //             $('#myText').show("fast", "swing");
    //             $('#btnIdentify').show("fast", "swing");
    //             $('#print_button').hide();
    //             $('#measurementDiv').hide();
    //             $('#btnGoogle').hide();
    //             dojo.disconnect(gsvClick);
    //             mapClickEvent.remove();
    //             dojo.disconnect(mapClickEvent);
    //             //disengage parcel identify tool
    //             dojo.byId("btnIdentify").innerHTML = "Identify: none";
    //             dojo.addClass("btnIdentify", "btn-default");
    //             dojo.removeClass("btnIdentify", "btn-info");
    //             dojo.addClass("btnIdentifyS", "btn-default");
    //             dojo.removeClass("btnIdentifyS", "btn-info");
    //         }
    //     });

});

}