app.initializeSelection= (function(){

    return function() { 

        require(["esri/toolbars/draw", "dojo/promise/all", "dojo/on", "esri/geometry/geometryEngine", "dojo/dom","esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color", "esri/symbols/SimpleMarkerSymbol"], function(Draw, all, on, GeometryEngine, dom, SimpleFillSymbol, SimpleLineSymbol, Color, SimpleMarkerSymbol){

            var mapdraw = new esri.toolbars.Draw(app.map);
            var mapDrawEnd;

            function validate(){
               var layers = $('.selBox:checked');
               if(layers.length==0){
                alert('Please mark at least one layer selectable in the layers menu')
                return false;
               }
               return true;
            }

            $('#selectLink').on('click', function(){
               app.deactivateMeasurement();
                           });

            $('#btnSelectExtent').on('click', function(){
                if(!validate()){return false}
                 app.map.graphics.clear();
                 dojo.disconnect(mapClickEvent)
                 mapdraw.activate(esri.toolbars.Draw.EXTENT); 
                 mapDrawEnd = dojo.connect(mapdraw,"onDrawEnd",drawEnd);
            })

            $('#btnSelectPolygon').on('click', function(){
              if(!validate()){return false}
                 app.map.graphics.clear();
                 dojo.disconnect(mapClickEvent)
                 mapdraw.activate(esri.toolbars.Draw.POLYGON); 
                 mapDrawEnd = dojo.connect(mapdraw,"onDrawEnd",drawEnd);
            })

            $('#btnSelectFreehandPolygon').on('click', function(){
              if(!validate()){return false}
                 app.map.graphics.clear();
                 dojo.disconnect(mapClickEvent)
                 mapdraw.activate(esri.toolbars.Draw.FREEHAND_POLYGON); 
                 mapDrawEnd = dojo.connect(mapdraw,"onDrawEnd",drawEnd);
            })

            $('#btnSelectPoint').on('click', function(){
              if(!validate()){return false}
                 app.map.graphics.clear();
                 dojo.disconnect(mapClickEvent)
                 mapdraw.activate(esri.toolbars.Draw.POINT); 
                 mapDrawEnd = dojo.connect(mapdraw,"onDrawEnd",drawEnd);
            })

             $('#btnClearSelected').on('click', function(){
                app.map.graphics.clear();
            })

            function drawEnd(geometry){

              if(geometry.type == 'point'){
                  geometry = GeometryEngine.buffer(geometry, 100, 'feet');
              }

              app.map.graphics.clear();
              //var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NONE, 
                    //     new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT,
                     //    new dojo.Color([255,255,0]), 2), new dojo.Color([255,255,0,0]));
              //var graphic = new esri.Graphic(geometry,symbol);
              //app.map.graphics.add(graphic);
              queryByGeometry(geometry);
              mapdraw.deactivate();
              dojo.disconnect(mapDrawEnd);
              mapClickEvent = on(app.map, "click", function(evt) {
                app.showLocation(evt);
                });
            }

            function queryByGeometry(geometry){

                //get currently selectable layers
                var layers = $('.selBox:checked');
               
                if(layers.length ===0 ){
                    return;
                }

                esri.show(dom.byId("loadingImg"))

                 var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                  new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                  new Color([255,255,0]), 2),new Color([255,255,0,0.25])
                 );

                 var sls = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                  new Color([255,255,0]), 3);

                  var sms = new SimpleMarkerSymbol();
                  sms.setStyle(SimpleMarkerSymbol.STYLE_CIRCLE);
                  sms.setSize(10);
                  sms.setColor(new Color([255,255,0,1]));

                var tasks = {};

                for(var i=0;i<layers.length;i++){
                    var layer = $(layers[i]).attr('id');
                    var service =  $(layers[i]).attr('data-service')
                    var layerNumber =  $(layers[i]).attr('data-layer-id');
	debugger
                    var url = window['layer'+service].url;

                    //need to check if it's a group layer first...

                    var subLayers = window['layer'+service].layerInfos[layerNumber].subLayerIds;

                    if(subLayers){
                        
                        subLayers.forEach(function(idx){
                            var query = new esri.tasks.Query();
                            query.geometry = geometry;
                            var querytask = new esri.tasks.QueryTask(url+'/'+idx);
                            query.where = '1=1';
                            query.outFields =['*'];          
                            query.returnGeometry = true;
                            query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                            var qr =querytask.execute(query);
                            var obj = {};
                            var layerName = window['layer'+service].layerInfos[idx].name;
                            tasks[layerName] = qr;
                        })

                    } else {

                        var query = new esri.tasks.Query();
                        query.geometry = geometry;
                        var querytask = new esri.tasks.QueryTask(url+'/'+layerNumber);
                        query.where = '1=1';       
                        query.outFields =['*'];             
                        query.returnGeometry = true;
                        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                        var qr =querytask.execute(query);
                        var layerName = window['layer'+service].layerInfos[layerNumber].name;
                        tasks[layerName]=qr;
                    }
                }

                all(tasks).then(function(queries){

                    var html = '<html><head><link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css" /></head><body style="padding:10px;">';

                    for(var r in queries){

                        var title= r;
                        var results = queries[r];

                        if(results.features.length > 0 ){

                            html += '<h3>'+r+'</h3><hr/>';
                            html+='<table class="table table-striped table-condensed table-bordered"><thead><tr>';

                            var fieldNames = Object.keys(results.features[0].attributes);

                             html+='<th>id</th>';

                            fieldNames.forEach(function(field){
                                html+='<th>'+field + '</th>';
                            })

                            html+= "</tr></thead><tbody>"

                            results.features.forEach(function(feat, i){
                                html+= "<tr>";

                                html += '<td>'+i+'</td>';
                               
                                fieldNames.forEach(function(field){
                                  
                                  if(typeof(feat.attributes[field]) == 'string'){
                                    if(feat.attributes[field].toUpperCase().indexOf('HTTP://')> -1 || feat.attributes[field].toUpperCase().indexOf('FILE://') > -1){

                                      html+='<td><a href="'+feat.attributes[field]+'" target="blank">'+feat.attributes[field]+'</a></td>';
                                    } else {
                                       html+='<td>'+feat.attributes[field]+'</td>';
                                    }
                                  } else {

                                    html+='<td>'+feat.attributes[field]+'</td>';
                                  }
                                })

                                html+='</tr>';

                                //draw feature

                                var graphic = feat;

                                if(feat.geometry.type == 'polyline'){
                                  graphic.setSymbol(sls);
                                } else if (feat.geometry.type == 'polygon'){
                                  graphic.setSymbol(sfs);
                                } else if (feat.geometry.type == 'point'){
                                  graphic.setSymbol(sms);
                                }
  
                                //Set the infoTemplate.
                               // graphic.setInfoTemplate(infoTemplate);
  
                                //Add graphic to the map graphics layer.
                                app.map.graphics.add(graphic);

                            })
                            html += '</tbody></table>'

                        } else {

                            html += '<h3>'+r+'</h3><hr/> <br/>No features found'
                        }

                    }

                    html+='</body></html>'

                    // var win = window.open(url, '_blank');
                    // win.focus();

                    var wnd = window.open("about:blank", "", "_blank");
                    wnd.document.write(html);

                    esri.hide(dom.byId("loadingImg"))

                });
            }
        })
    }
})();