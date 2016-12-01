app.initializePrint = function(){

    require(["esri/request"], function(esriRequest){

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
    })
};