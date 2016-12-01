 app.initializeLayerList = (function() {

             return function() {
return
                 require(["dojo/promise/all", "dojo/on"], function(all, on) {

                         app.legendItemTemplate = UnderscoreTemplate("<table style='width:100%;'><tr><td style='width:30px;'><label class='beforecheck'><input type='checkbox' class='toc-item list_item<%=obj.idx%>' id='<%=obj.t%><%=obj.id%>CheckBox' value=0  /></label></td><td><label class='aftercheck'><input type='checkbox' class='selbox' id='<%=obj.t%>selBox' data-layer-id='<%=obj.id%>' data-service-name='<%=obj.t%>'/><span class='label'><%=obj.name%></span></label></td></tr></table>");

                         console.log(layerBaseData.layerInfos)

                         layerBaseData.layerInfos.forEach(function(info){

                            info.t = 'BaseData';
                            info.idx = '1';

                            var item = app.legendItemTemplate(info);
                             $('#basedatagroup > div.ui-controlgroup-controls').append(item);


                         })

                         $('#basedatagroup').trigger('create');

                         layers.boundaries.forEach(function(lyr) {
                             var item = app.legendItemTemplate(lyr);
                             $('#boundariesgroup > div.ui-controlgroup-controls').append(item);
                         })

                         $('#boundariesgroup').trigger('create');


                         layers.utilities.forEach(function(lyr) {
                             var item = app.legendItemTemplate(lyr);
                             $('#utilitiesgroup > div.ui-controlgroup-controls').append(item);
                         })

                         $('#utilitiesgroup').trigger('create');

                     })
                 }})();