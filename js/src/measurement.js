 // todo: clicking on measure link in nav bar should disable measuring if it is active

 app.initializeMeasurement = function() {

    require(["esri/dijit/Measurement","esri/geometry/geometryEngine","dojo/dom", "dojo/on", "esri/geometry/Polyline","esri/geometry/Polygon","esri/geometry/Point", "esri/symbols/Font", "esri/symbols/TextSymbol", "esri/Color", "esri/graphic"], function(Measurement,GeometryEngine,dom, on, Polyline, Polygon, Point, Font, TextSymbol, Color, Graphic){

     measurement = new Measurement({
         map: app.map,
         defaultLengthUnit: "esriFeet",
         defaultAreaUnit: "esriSquareFeet"
     }, dom.byId("measurementDiv"));
     measurement.startup();

     var mapMeasureEvent, lastPoint;
     var textSymbols = [];

    measurement.on('tool-change', function(a){
        //console.log(a)
        //if(a.toolName === null){
            if (textSymbols.length > 0) {
             textSymbols.forEach(function(g) {
                 app.map.graphics.remove(g);
             })
             textSymbols = [];
         }
        //}
    })

     measurement.on("measure-start", function(evt) {
         //disable identify click
         if (textSymbols.length > 0) {
             textSymbols.forEach(function(g) {
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

         if(measurement.getTool().toolName == 'distance'){
             var point = measurement._currentStartPt;

             lastPoint = point;
             mapMeasureEvent = on(app.map, "mouse-move", function(evt) {

                 var line = new Polyline(app.map.spatialReference);

                 line.addPath([point, evt.mapPoint]);
                 var unit = measurement.getUnit();

                 length = GeometryEngine.planarLength(line, unit.toLowerCase());

                 $('#dijit_layout_ContentPane_3').html((length).toFixed(2) + ' ' + unit.toLowerCase())
             });
         }

     });

     measurement.on('measure-end', function(evt) {
         dojo.disconnect(mapMeasureEvent)
         $('#floatingMeasurePanel').hide();


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

         //if IE remove last textSymbol
         if (rv == 11 || userAgent.indexOf('ie') != -1) {
            app.map.graphics.remove(textSymbols[textSymbols.length-1])
        }

     })

     measurement.on("measure", function(evt) {
        console.info('measure event')
         dojo.disconnect(idfClick);
         dojo.disconnect(gsvClick);
         mapClickEvent.remove();
         dojo.disconnect(mapClickEvent);
         dojo.disconnect(mapMeasureEvent);
         var point = evt.geometry;
         curLength = evt.values;
         var unit = measurement.getUnit();

        if(measurement.getTool().toolName == 'distance'){

             mapMeasureEvent = on(app.map, "mouse-move", function(evt) {
                 var line = new Polyline(app.map.spatialReference);
                 line.addPath([point, evt.mapPoint]);

                 length = GeometryEngine.planarLength(line, unit.toLowerCase());
                 $('#dijit_layout_ContentPane_3').html((curLength + length).toFixed(2) + ' ' + unit.toLowerCase())
                 $('#floatingMeasurePanel').css({
                     'top': evt.clientY - 30,
                     'left': evt.clientX + 20
                 }).html((curLength + length).toFixed(2) + ' ' + unit.toLowerCase());
             });

             var line = new Polyline(app.map.spatialReference);
             line.addPath([point, lastPoint]);
             lastPoint = point;

             length = GeometryEngine.planarLength(line, unit.toLowerCase());

             var font = new Font("16px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLDER, 'Arial, sans-serif');
             var t = new TextSymbol((length).toFixed(2) + ' ' + unit.toLowerCase(), font, new Color([0, 0, 0]));

             t.setOffset(20, 30);
             console.log(point);
             var g2 = new Graphic(point, t);
             textSymbols.push(g2);
             app.map.graphics.add(g2);
             $('#floatingMeasurePanel').css({
                 'top': evt.clientY - 30,
                 'left': evt.clientX + 20
             })
             $('#floatingMeasurePanel').show();
         } else {

             mapMeasureEvent = on(app.map, "mouse-move", function(evt) {
                
                 var poly = new Polygon(app.map.spatialReference);
                 
                 console.log('Num points: '+point.rings[0].length + ' last point: '+point.rings[0][point.rings[0].length-2])

                 var floatingPoint = [evt.mapPoint.x, evt.mapPoint.y];

                 var newpoly = JSON.parse(JSON.stringify(point));

                 newpoly.rings[0].splice(newpoly.rings[0].length-1, 0,floatingPoint).reverse();

                 poly.addRing(newpoly.rings[0]);
                 
                 if(unit=='Sq Feet'){unit ='square-feet'}

                 area = GeometryEngine.planarArea(poly, unit.toLowerCase());

                 area = Math.abs(area);

                 $('#dijit_layout_ContentPane_3').html(numberWithCommas(area.toFixed(2)) + ' ' + unit.toLowerCase())

                 $('#floatingMeasurePanel').css({
                     'top': evt.clientY - 30,
                     'left': evt.clientX + 20
                 }).html(area.toFixed(2) + ' ' + unit.toLowerCase());
             });


             //add segment text
             var line = new Polyline(app.map.spatialReference);
             line.addPath([point.rings[0][point.rings[0].length-2], point.rings[0][point.rings[0].length-1]]);
             
             var munit = 'feet';
             var length = GeometryEngine.planarLength(line, munit);
             
             var font = new Font("16px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLDER, 'Arial, sans-serif');
             var t = new TextSymbol((length).toFixed(2) + ' ' + munit.toLowerCase(), font, new Color([0, 0, 0]));

             t.setOffset(20, 30);
             var p = new Point(point.rings[0][point.rings[0].length-2],app.map.spatialReference);
             console.log(p)
             var g2 = new Graphic(p, t);
             textSymbols.push(g2);
             app.map.graphics.add(g2);
         }
     });

     $("#measureLink").click(function() {

         if ($('#measurementDiv').is(':visible')) {

             $('#measurementDiv').hide("fast", "swing");
             mapClickEvent = on(app.map, "click", function(evt) {
                 showLocation(evt);
             });

             if (textSymbols.length > 0) {
                 textSymbols.forEach(function(g) {
                     app.map.graphics.remove(g);
                 })
                 textSymbols = [];
             }

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

     function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
 });


 }