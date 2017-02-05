 // todo: clicking on measure link in nav bar should disable measuring if it is active
app.mapMeasureEvent = null;
app.textSymbols = [];

 app.initializeMeasurement = function() {

    require(["esri/dijit/Measurement","esri/geometry/geometryEngine","dojo/dom", "dojo/on", "esri/geometry/Polyline","esri/geometry/Polygon","esri/geometry/Point", "esri/symbols/Font", "esri/symbols/TextSymbol", "esri/Color", "esri/graphic"], function(Measurement,GeometryEngine,dom, on, Polyline, Polygon, Point, Font, TextSymbol, Color, Graphic){

     measurement = new Measurement({
         map: app.map,
         defaultLengthUnit: "esriFeet",
         defaultAreaUnit: "esriSquareFeet"
     }, dom.byId("measurementDiv"));
     measurement.startup();

     var lastPoint;

    measurement.on('tool-change', function(a){
        if (app.textSymbols.length > 0) {
            app.textSymbols.forEach(function(g) {
                app.map.graphics.remove(g);
            })
            app.textSymbols = [];
        }
    })

    measurement.on("measure-start", function(evt) {
      
        //disable identify click
        if (app.textSymbols.length > 0) {
            app.textSymbols.forEach(function(g) {
                app.map.graphics.remove(g);
            })
            app.textSymbols = [];
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
        dojo.disconnect(app.mapMeasureEvent);

        if(measurement.getTool().toolName == 'distance'){
            var point = measurement._currentStartPt;

            lastPoint = point;
            app.mapMeasureEvent = on(app.map, "mouse-move", function(evt) {

                var line = new Polyline(app.map.spatialReference);

                line.addPath([point, evt.mapPoint]);
                var unit = measurement.getUnit().replace(/\s/g, '-');

                length = GeometryEngine.planarLength(line, unit.toLowerCase());

                $('#dijit_layout_ContentPane_3').html((length).toFixed(2) + ' ' + unit.toLowerCase())
            });
        }
    });

    measurement.on('measure-end', function(evt) {

        dojo.disconnect(app.mapMeasureEvent)

        $('#floatingMeasurePanel').hide();

        var mTool = measurement.getTool().toolName;

         if(mTool != 'distance' && mTool != 'location'){
           var point = evt.geometry;
           var unit = measurement.getUnit().replace(/\s/g, '-');
           var munit;
            if(unit=='square-miles' || unit == 'Sq-Miles'){
               munit = 'miles';
            } else if(unit=='square-feet' || unit =='Sq-Feet'){
               munit='feet'
            } else if(unit =='Sq-Kilometers'){
              munit = 'kilometers'
           } else if (unit=='Sq-Meters'){
               munit = 'meters';
           }else {
                console.log(munit)
           }

           //add anno for last segment of polygon
          addSegText(munit, point.rings[0][point.rings[0].length-2], point.rings[0][point.rings[0].length-1]);

         }

        bringTextToFront();

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
           app.map.graphics.remove(app.textSymbols[app.textSymbols.length-1])
       }
    })

    measurement.on("measure", function(evt) {
            
        dojo.disconnect(idfClick);
        dojo.disconnect(gsvClick);
        mapClickEvent.remove();
        dojo.disconnect(mapClickEvent);
        dojo.disconnect(app.mapMeasureEvent);
        var point = evt.geometry;
        curLength = evt.values;
        var unit = measurement.getUnit().replace(/\s/g, '-')
      
        if(measurement.getTool().toolName == 'distance'){

            app.mapMeasureEvent = on(app.map, "mouse-move", function(evt) {
                 var line = new Polyline(app.map.spatialReference);
                 line.addPath([point, evt.mapPoint]);

                 length = GeometryEngine.planarLength(line, unit.toLowerCase());
                 $('#dijit_layout_ContentPane_3').html((curLength + length).toFixed(2) + ' ' + unit.toLowerCase())
                 $('#floatingMeasurePanel').css({
                     'top': evt.clientY - 30,
                     'left': evt.clientX + 20
                 }).html((curLength + length).toFixed(2) + ' ' + unit.toLowerCase());
            });

            addSegText(unit.toLowerCase(), point, lastPoint);

            lastPoint = point;
            $('#floatingMeasurePanel').css({
                'top': evt.clientY - 30,
                'left': evt.clientX + 20
            })
            $('#floatingMeasurePanel').show();
        } else {

            app.mapMeasureEvent = on(app.map, "mouse-move", function(evt) {
                
                var poly = new Polygon(app.map.spatialReference);
                
                var floatingPoint = [evt.mapPoint.x, evt.mapPoint.y];

                var newpoly = JSON.parse(JSON.stringify(point));

                newpoly.rings[0].splice(newpoly.rings[0].length-1, 0,floatingPoint).reverse();

                poly.addRing(newpoly.rings[0]);
                
                if(unit=='Sq-Feet'){unit ='square-feet'}
                else if(unit=='Sq-Miles'){unit ='square-miles'}
                else if(unit=='Sq-Kilometers'){unit ='square-kilometers'}
                else if(unit=='Sq-Meters'){unit ='square-meters'}
                   
                area = GeometryEngine.planarArea(poly, unit.toLowerCase());

                area = Math.abs(area);

                $('#dijit_layout_ContentPane_3').html(numberWithCommas(area.toFixed(2)) + ' ' + unit.toLowerCase())

                $('#floatingMeasurePanel').css({
                    'top': evt.clientY - 30,
                    'left': evt.clientX + 20
                }).html(area.toFixed(2) + ' ' + unit.toLowerCase());
             });

             //need to fix this.
             var munit;
             if(unit=='square-miles' || unit == 'Sq-Miles'){
                munit = 'miles';
             } else if(unit=='square-feet' || unit =='Sq-Feet'){
                munit='feet'
             } else if(unit =='Sq-Kilometers'){
               munit = 'kilometers'
            } else if (unit=='Sq-Meters'){
                munit = 'meters';
            }else {
                 console.log(munit)
            }

             //add segment text
            if(point.rings[0].length == 5){
                
                addSegText(munit, point.rings[0][0], point.rings[0][1])
                bringTextToFront();
            }

            var index1 = 2, index2 = 3;

            if(point.rings[0].length> 5){
               index1 = 4; index2 = 5;
            }

            addSegText(munit, point.rings[0][point.rings[0].length-index1], point.rings[0][point.rings[0].length-index2] )
           
            bringTextToFront();
        }
     });

    function addSegText(munit, pt1, pt2){
        
         var line = new Polyline(app.map.spatialReference);
             line.addPath([pt1, pt2]);
             
         var length = GeometryEngine.planarLength(line, munit);
             
         var font = new Font("16px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLDER, 'Arial, sans-serif');
         var t = new TextSymbol((length).toFixed(2) + ' ' + munit.toLowerCase(), font, new Color([0, 0, 0]));

         if(!pt1.x){
            pt1 = {x:pt1[0], y:pt1[1]};
            pt2 = {x:pt2[0], y:pt2[1]};
         }
         
         var upc = findMiddlePoint(pt1,pt2)

         var p = new Point(upc, app.map.spatialReference);
         var g2 = new Graphic(p, t);
         app.textSymbols.push(g2);
         app.map.graphics.add(g2)
    }

    function findMiddlePoint(p1, p2){
        
        var xdiff = Math.abs(p1.x - p2.x)/2;
        var ydiff = Math.abs(p1.y - p2.y)/2;

        var x = p1.x;
        var y = p1.y;

        //is second to last point north or south?
        if(p1.x > p2.x){
           x -= xdiff;
        } else {
           x += xdiff;
        }

        if(p1.y > p2.y){
           y -= ydiff;
        } else {
           y += ydiff;
        }
        return [x,y];
    }

    function bringTextToFront(){
        app.textSymbols.forEach(function(g) {
             g.getDojoShape().moveToFront();
         })
    }

     $("#measureLink").click(function() {

         if ($('#measurementDiv').is(':visible')) {

            

         } else {
             
             mapClickEvent.remove();
             dojo.disconnect(mapClickEvent);
             //app.map.graphics.clear();
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

 app.deactivateMeasurement = function(){

    require(["dojo/on"], function(on){

        measurement.clearResult();
                
        if(measurement.getTool()){                
            measurement.setTool(measurement.getTool().toolName, false)
        }
         $('#measurementDiv').hide("fast", "swing");

         if (app.textSymbols.length > 0) {
             app.textSymbols.forEach(function(g) {
                 app.map.graphics.remove(g);
             })
             app.textSymbols = [];
         }
     })
 }