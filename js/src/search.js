
app.initializeSearch = function(){


    require(["dojo/dom","esri/symbols/SimpleMarkerSymbol", "esri/Color", "esri/graphic", "esri/geometry/Point"], function(dom, SimpleMarkerSymbol, Color, Graphic, Point){

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
            } else {
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
                    else if (searchInput.indexOf(" & ") > -1 || searchInput.toUpperCase().indexOf(" AND ") > -1) {

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

        function showQueryResults(results) {
            //set search results polygon symbol
  
            var symbolQuery = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255, 0, 0]), 3), new dojo.Color([255, 255, 0]));
 
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
		debugger
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
                var symbolQuerySD = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255, 0, 0]), 3), new dojo.Color([255, 255, 0]));

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
            } else if (results.candidates.length >=1){

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
            } 
            // else if (results.candidates.length > 1){
                
            //     dojo.byId("leftPane").innerHTML = "";
            //     intrsContent = '<ul id="asc">';
            //     results.candidates.forEach(function(cand){
            //         var content1 = "<li><a class='intersection-candidate' href='#' data-coords='"+JSON.stringify(cand.location)+"'>" + cand.address + "<br/><i>"+cand.score+"</i></a></li>";
            //         intrsContent += content1;
            //     })
                
            //     intrsContent += '</ul>';
            //     var intrsCount = "<div>" + "We found " + results.candidates.length.toString() + " matches.<br /></div>";

            //     dom.byId("featureCount").innerHTML = "";

            //     dom.byId("leftPane").innerHTML = intrsCount + intrsContent;
            //     openRightPanelSTab();

            //      $('.intersection-candidate').on('click', function(){

            //         app.map.graphics.clear();

            //         var coords = JSON.parse($(this).attr('data-coords'));

            //         var markerSymbol = new SimpleMarkerSymbol();
            //         markerSymbol.setPath("M16,4.938c-7.732,0-14,4.701-14,10.5c0,1.981,0.741,3.833,2.016,5.414L2,25.272l5.613-1.44c2.339,1.316,5.237,2.106,8.387,2.106c7.732,0,14-4.701,14-10.5S23.732,4.938,16,4.938zM16.868,21.375h-1.969v-1.889h1.969V21.375zM16.772,18.094h-1.777l-0.176-8.083h2.113L16.772,18.094z");
            //         markerSymbol.setColor(new Color("#00FFFF"));

            //         var graphic = new Graphic(new Point(coords,app.map.spatialReference), symbolPts);

            //         app.map.graphics.add(graphic);
                
            //         app.map.centerAndZoom(coords, 6);

            //     })
            // }
        }       

	})
}