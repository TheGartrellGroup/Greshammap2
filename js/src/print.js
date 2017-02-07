app.export= {
        mode: 'PDF',
        init: function() {

            function setAspectRatio(layout, format, size, parcel) {

                if (format == 'IMAGE') {
                    app.export.cropper.setAspectRatio(NaN);
                } else if (layout == 'PORTRAIT') {
                    
                    if (size == 'SMALL') {
                        if(parcel){
                            app.export.cropper.setAspectRatio(1.6);
                        }else {
                            app.export.cropper.setAspectRatio(1);
                        }
                    } else {
                        if(parcel){
                            app.export.cropper.setAspectRatio(1);
                        }else {
                            app.export.cropper.setAspectRatio(0.8);
                        }
                    }
                } else {
                    if(size=='SMALL'){
                        app.export.cropper.setAspectRatio(2)
                    } else {
                        app.export.cropper.setAspectRatio(2.262857142857143)
                    }
                }
            }
            
            $('#printLink').off('click').on('click', function() {

                $("#loadingImg").show();

                app.export.map(function(url) {

                    //Change format
                    $('#grpFormat label').on('click', function() {
                        setTimeout(function() {
                            var newMode = $('[name="grpFormat"]:checked').val()

                            if ((newMode !== 'IMAGE' && app.export.mode == 'IMAGE') || (newMode == 'IMAGE' && app.export.mode !== 'IMAGE')) {

                                var layout = $('[name="grpLayout"]:checked').val();
                                var size = $('[name="grpSize"]:checked').val();
                                var format = $('[name="grpFormat"]:checked').val();
                                var parcel = $("#chk-parcel-data").is(':checked')
                                setAspectRatio(layout, format, size, parcel);

                            }

                            if (newMode == 'IMAGE') {
                                $('#grpLayout > label').attr('disabled', true);
                                $('#grpSize > label').attr('disabled', true);
                                $('.export-label').find('input').attr('disabled', true);
                            } else {
                                $('#grpLayout > label').removeAttr('disabled');
                                $('#grpSize > label').removeAttr('disabled');
                            }

                            app.export.mode = newMode;
                        }, 1);
                    })

                    //Change layout or size
                    $('#grpLayout label, #grpSize label').on('click', function() {

                        if ($('[name="grpFormat"]:checked').val() !== 'IMAGE') {
                            setTimeout(function() {
                                var layout = $('[name="grpLayout"]:checked').val();
                                var size = $('[name="grpSize"]:checked').val();
                                var format = $('[name="grpFormat"]:checked').val();
                                var parcel = $('#chk-parcel-data').is(':checked');
                                setAspectRatio(layout, format, size, parcel);
                            }, 1)
                        }
                    })
                    
                    $('#exportModal').off('hidden.bs.modal').on('hidden.bs.modal', function() {
                        app.export.cleanup();
                    })

                    app.export.button = Ladda.create( document.querySelector( '#btn-export' ) );
                    
                    $('#exportModal').off('shown.bs.modal').on('shown.bs.modal', function() {

                        $('#exportImage').attr('src', url);

                        var image = document.getElementById('exportImage');

                        image.onload = function(){
                            app.export.cropper = new Cropper(image, {
                                zoomable:false,
                                zoomOnWheel:false,
                                minCropBoxWidth:200,
                                minCropBoxHeight:100
                            });

                            //what is the ratio?
                            setTimeout(function() {
                                var layout = $('[name="grpLayout"]:checked').val();
                                var size = $('[name="grpSize"]:checked').val();
                                var format = $('[name="grpFormat"]:checked').val();
                                var parcel = $('#chk-parcel-data').is(':checked');
                                setAspectRatio(layout, format, size, parcel);
                            }, 1)

                            $("#loadingImg").hide();

                            if($("#chk-parcel-data").is(':checked')){
                                $($('#grpLayout').children()[1]).attr('disabled', true)
                                $($('#grpFormat').children()[1]).attr('disabled', true)
                                $($('#grpFormat').children()[0]).addClass('active');
                                $($('[name="grpFormat"]')[0]).attr('checked', true);
                                $($('[name="grpFormat"]')[1]).removeAttr('checked');
                            } else {
                                 $($('#grpFormat').children()[1]).removeAttr('disabled')
                            }

                        }
                    })

                    if ($('#accordionSearch').children().length){
                        //show option to include parcel info.
                        $("#chk-parcel-data-div").show();
                        $("#chk-parcel-data").attr('checked', true);
                        $($('#grpLayout').children()[1]).attr('disabled', true)
                    } else {
                        $("#chk-parcel-data-div").hide();
                        $("#chk-parcel-data").removeAttr('checked');
                        $($('#grpLayout').children()[1]).removeAttr('disabled')
                    }

                    $('#exportModal').modal('show')

                });
            })

            $('#btn-export').on('click', function() {

                app.export.button.start();

                switch (app.export.mode) {
                    case "PRINT":
                        app.export.output('print');
                        break;
                    case "PDF":
                        app.export.output('pdf');
                        break;
                    case "IMAGE":
                        app.export.output('image');
                        break;
                }
            });

            $('#chk-parcel-data').on('change', function(){

                var parcel = $(this).is(':checked')

                if(parcel){
                    
                    $($('#grpLayout').children()[1]).attr('disabled', true)

                    $($('#grpLayout').children()[0]).addClass('active');
                    $($('#grpLayout').children()[1]).removeClass('active');
                    $($('[name="grpLayout"]')[0]).prop('checked', true);
                    $($('[name="grpLayout"]')[1]).removeAttr('checked');

                    $($('#grpFormat').children()[1]).prop('disabled', true)

                    $($('#grpFormat').children()[0]).addClass('active');
                    $($('[name="grpFormat"]')[0]).prop('checked', true);
                    $($('[name="grpFormat"]')[1]).removeAttr('checked');

                    $($('#grpSize').children()).removeAttr('disabled')
                } else {
                    $($('#grpFormat').children()[1]).removeAttr('disabled')
                    $($('#grpLayout').children()[1]).removeAttr('disabled')
                }

                setTimeout(function() {
                    var layout = $('[name="grpLayout"]:checked').val();
                    var size = $('[name="grpSize"]:checked').val();
                    var format = $('[name="grpFormat"]:checked').val();
                    setAspectRatio(layout, format, size, parcel);
                }, 10)
            })
        },
        map: function(cb) {

            require(["esri/tasks/PrintTask"], function(PrintTask){
                var printTask = new PrintTask();

                var Web_Map_as_JSON = printTask._getPrintDefinition(app.map,  esri.tasks.PrintParameters);

                var $map = $('#map')
                Web_Map_as_JSON.exportOptions  = {'outputSize':[window.innerWidth, window.innerHeight],"dpi": 96}
               
                $.ajax({'url':'http://localhost/proxy/proxy.ashx?http://leia/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task/execute', 'data':'f=json&Format=PNG32&Layout_Template=MAP_ONLY&Web_Map_as_JSON='+encodeURIComponent(JSON.stringify(Web_Map_as_JSON)), 'dataType':'json', 'method':'POST'}).then(function(data){
                        cb(data.results[0].value.url)
                    })
            })
        },
        print: function(canvas) {

            $('#exportModal').modal('hide');
          
            $('body').append($('<img src="'+canvas.toDataURL()+'" class="background-print background-print-top">'));

            if(app.export.legendCanvas !== undefined){
                $('body').append($('<img src="'+app.export.legendCanvas.toDataURL()+'" class="background-print" style="position:absolute;top:'+$('.background-print').height()+'px">'));
            }
            window.print();
            $('.background-print').remove();

        },
        image: function(canvas) {

            var image = new Image();

            image.src = canvas.toDataURL();

            image.onload = function(){

                if(app.export.legendCanvas !== undefined){

                    var legendImage = new Image()

                    legendImage.src = app.export.legendCanvas.toDataURL();

                    legendImage.onload = function(){
                        var newCanvas = document.createElement('canvas');
                        newCanvas.height=image.height+legendImage.height;
                        newCanvas.width=Math.max(image.width, legendImage.width);
                        var ctx = newCanvas.getContext('2d');
                        ctx.fillStyle = '#FFF';
                        ctx.fillRect(0,0,newCanvas.width, newCanvas.height);

                        ctx.drawImage(image, 0, 0)

                        ctx.drawImage(legendImage, 20, image.height-160);

                        newCanvas.toBlob(function(blob) {
                            saveAs(blob, "image.png");
                        });
                    }
                } else {
                    canvas.toBlob(function(blob) {
                        saveAs(blob, "export.png");
                    });
                }

                app.export.button.stop()
            }
        },
        output: function(mode){

            require(["dojo/_base/array"], function(arrayUtils){

                var layout = $('[name="grpLayout"]:checked').val().toLowerCase();
                var size = $('[name="grpSize"]:checked').val().toLowerCase();
                
                //invalidate if previously created...
                app.export.legendCanvas = undefined;
                app.export.datagridCanvas = undefined;

                var mainCanvas = document.createElement('canvas'), 
                    mapCanvas = app.export.cropper.getCroppedCanvas(),
                    im = new Image(),
                    northArrowImage,
                    ctx,
                    fullImage,
                    lctx,
                    keepOnSinglePage = true,
                    runningHeight=0;

                var addTitle = $('#chk-export-title').is(':checked');
                var addSubtitle = $('#chk-export-subtitle').is(':checked');
                var addLegend = $('#chk-export-legend').is(':checked');
                var addScale = $('#chk-export-scale').is(':checked');
                var addNorthArrow = $('#chk-export-north-arrow').is(':checked');

                var parcel = $("#chk-parcel-data").is(':checked');

                if(mode=='image' && !addTitle && !addSubtitle && !addLegend && !addScale && !addNorthArrow){
                    app.export.image(mapCanvas);
                    app.export.button.stop();
                    return;
                }

                // console.log({height:mapCanvas.height, width:mapCanvas.width})

                im.src = mapCanvas.toDataURL();

                im.onload = function(){

                    var mapHeightOffset = 0, margin = 0;

                    var maxLegendHeightSpace, maxLegendXCoord;

                    if(layout =='portrait'){
                        if(size =='small'){
                            maxLegendHeightSpace = (parcel) ? 300 : 140;
                            maxLegendXCoord = (parcel) ? 570 : 360;
                        } else {
                            maxLegendHeightSpace = (parcel) ? 500 : 222;
                            maxLegendXCoord = (parcel) ? 800 : 660;
                        }
                    } else if(layout=='landscape') {
                        if (size =='small'){
                             maxLegendHeightSpace = 130;
                             maxLegendXCoord = 660;
                        } else {
                             maxLegendHeightSpace = 200;
                             maxLegendXCoord = 880;
                        }
                    }

                    if(!addTitle){
                        maxLegendHeightSpace += 30;
                    } else{
                        mapHeightOffset += 39;
                    }

                    if(!addSubtitle){
                        maxLegendHeightSpace += 24
                    } else {
                        mapHeightOffset += 30;
                    }

                    console.info('Legend height space is '+maxLegendHeightSpace)

                    if(mode !== 'image'){

                        switch(layout){

                            case 'portrait':
                                switch(size){
                                    case 'small':
                                        mainCanvas.width  = 768;
                                        mainCanvas.height = 1008;
                                        ctx = mainCanvas.getContext('2d');
                                        if(parcel){
                                            ctx.drawImage(im, 0, mapHeightOffset, 768, 480);
                                        } else {
                                            ctx.drawImage(im, 0, mapHeightOffset, 768, 768);
                                        }
                                        break;
                                    case 'large':
                                        mainCanvas.width  = 1008;
                                        // mainCanvas.height = 1584;
                                        mainCanvas.height = 1600;
                                        ctx = mainCanvas.getContext('2d');

                                        if(parcel){
                                           ctx.drawImage(im, 0, mapHeightOffset, 1036, 1036);
                                        } else {
                                           ctx.drawImage(im, 0, mapHeightOffset, 1008, 1260);
                                        }

                                        break;
                                    }
                                break;

                            case 'landscape':
                                switch(size){
                                    case 'small':
                                        mainCanvas.width  = 1008;
                                        mainCanvas.height = 768;
                                        ctx = mainCanvas.getContext('2d');
                                        ctx.drawImage(im, 0, mapHeightOffset, 1008, 538);
                                        break
                                    case 'large':
                                        mainCanvas.width  = 1584;
                                        mainCanvas.height = 1008;
                                        ctx = mainCanvas.getContext('2d');
                                        ctx.drawImage(im, 0, mapHeightOffset, 1584, 700);
                                        break
                                }
                                break;
                        }

                    } else {

                        mainCanvas.width  = mapCanvas.width+40;
                        mainCanvas.height = mapCanvas.height+250;

                        ctx = mainCanvas.getContext('2d'),

                        ctx.fillStyle = '#FFF';
                        ctx.fillRect(0,0,mainCanvas.width, mainCanvas.height);
                        ctx.drawImage(im, 20, mapHeightOffset, mapCanvas.width, mapCanvas.height);
                        margin = 20;
                        keepOnSinglePage = false;
                    }

                    var mapComponents = [];

                    /* Title */
                    if(addTitle && $('#txt-export-title').val() !== ''){
                        ctx.fillStyle = '#111111';
                        ctx.font = "28px 'Arial'";
                        ctx.fillText( $('#txt-export-title').val(), margin, 30);
                    }

                    /* Subtitle */
                    if(addSubtitle && $('#txt-export-subtitle').val() !== ''){
                        ctx.fillStyle = '#111111';
                        ctx.font = "20px 'Arial'";
                        ctx.fillText( $('#txt-export-subtitle').val(), margin, mapHeightOffset-14);
                    }

                    /* Legend and legend header*/
                    // need something here to detect if legends or not...
                    if(addLegend ){
                        var hasLegend = false;

                        // at this point we need to know if we need another page
                        // to accommodate the legend. If any legend is going to exceed the height of the allotted space, then we'll need another page.

                        app.map.layerIds.forEach(function(layer) {
                            var l = app.map.getLayer(layer);
                            
                            if (l.id != 'layer0' && l.id != 'layer1' && l.id != 'layer2' && l.id != 'layer3' && l.id != 'layer4' && l.id != 'layer5') {
                             //basemap
                                l.visibleLayers.forEach(function(val) {
                                    
                                    var fullHeight = 0;
                                    hasLegend = true;

                                    var lg;
                                    for(var i=0;i<l.legendResponse.layers.length;i++){
                                        if(l.legendResponse.layers[i].layerId==val){
                                            lg = l.legendResponse.layers[i]; 
                                            break;
                                        }
                                    }

                                    if(lg) {

                                        lg.legend.forEach(function(symbol){
                                            var linesHigh = app.export.calcTextHeight(ctx, symbol.label, 140-41, 19)
                                            fullHeight += 19 * linesHigh;
                                        })

                                        console.info('legend is: '+(fullHeight) + ' high');

                                        runningHeight += fullHeight;

                                        if (fullHeight > maxLegendHeightSpace){
                                            //need another page...
                                            console.log('Height of legend ('+fullHeight+') is more than maxLegendHeightSpace ('+maxLegendHeightSpace)
                                            keepOnSinglePage = false;
                                        }

                                        var name = l.layerInfos[parseInt(val)].name;

                                        mapComponents.push(new Promise(function(resolve, reject) {
                                            resolve({
                                                object: 'legend',
                                                canvas: app.export.renderCanvasLegend(name, lg.legend)
                                            })
                                        }))
                                    }
                                })
                            }
                        })

                        console.info('runningHeight is: '+runningHeight)

                        if(parcel && runningHeight > maxLegendHeightSpace){
                            keepOnSinglePage = false;
                        }

                        console.info('keepOnSinglePage: '+keepOnSinglePage)

                        if(!keepOnSinglePage){
                            lctx = app.export.createLegendCanvas(Math.max(runningHeight, maxLegendHeightSpace));
                        }

                        // Legend title
                        if(hasLegend){
                            if(keepOnSinglePage){
                                var legendTitleY =  (parcel) ? ((size==="small") ? 585 : 1100) : mainCanvas.height -maxLegendHeightSpace-10;
                                var legendTitleX = (parcel) ? ((size==="small") ? 580 : 780) : 0;
                                ctx.fillStyle = '#111111';
                                ctx.font = "20px 'Arial'";
                                ctx.fillText('Legend', legendTitleX, legendTitleY);
                            } else {
                                lctx.fillStyle = '#111111';
                                lctx.font = "20px 'Arial'";
                                lctx.fillText('Legend', 0, 30);
                            }
                        }
                    }

                    /* Scale */
                    var scaleHeight, scaleWidth;
                    if(addScale){
                        $('.esriScalebar').css('width', 'auto');
                        scaleWidth = $('.esriScalebar').width()+30;
                        scaleHeight = $('.esriScalebar').height()+20;

                        mapComponents.push(new Promise(function(resolve, reject) {
                            setTimeout(function() {(html2canvas($('.esriScalebar'), {
                            width: scaleWidth,
                            height: scaleHeight
                        }).then(function(canvas){resolve({'canvas':canvas, 'object':'scale'})}))},500)}));
                    }

                     /* NorthArrow */
                    if(addNorthArrow){
                        
                        northArrowImage = new Image();

                        mapComponents.push(new Promise(function(resolve){
                            northArrowImage.onload = function(){
                                resolve({'canvas':northArrowImage, 'object':'north_arrow'});
                            }
                        }));

                        northArrowImage.src = 'images/north_arrow.png';
                    }

                    Promise.all(mapComponents).then(function(){

                        var elements = [];
                        var parcel = $("#chk-parcel-data").is(':checked');
                        var movingLegendOriginX = (parcel && keepOnSinglePage) ? ((size==='small') ? 570 : 800): 0;
                        var movingLegendOriginY = (keepOnSinglePage===true) ? (parcel) ? ((size==="small") ? 600 : 1110) : mainCanvas.height-maxLegendHeightSpace : 50;

                        function processor(i){
                       
                            if (i> elements.length-1){

                                //app.export.button.stop();

                                if(mode=='pdf'){
                                    app.export.pdf(mainCanvas);
                                } else if (mode=='print') {
                                    app.export.print(mainCanvas);
                                } else { //image
                                    app.export.image(mainCanvas);
                                }

                                return;
                            }

                            var element = elements[i];
                            var im = new Image();
                            i+=1;
                            switch(element.object){
                                case 'scale':

                                    im.onload = function(){
                                        ctx.drawImage(im, mainCanvas.width-190,mainCanvas.height-(scaleHeight+20), scaleWidth,  scaleHeight);
                                        processor(i);
                                    };

                                    im.src = element.canvas.toDataURL();
                                    break;
                                case 'legend':
                                    im.onload = function(){
                                        //console.log(im.height)
                                        //console.log('image taller than what\s left: '+(im.height > mainCanvas.height-movingLegendOriginY))

                                        if(!keepOnSinglePage){
                                             if(im.height > app.export.legendCanvas.height-movingLegendOriginY){
                                                 movingLegendOriginX+= 175;
                                                 movingLegendOriginY= 50
                                             }
                                        } else {
                                            if(im.height > mainCanvas.height-movingLegendOriginY){
                                           movingLegendOriginX+= 175;
                                           movingLegendOriginY = mainCanvas.height-maxLegendHeightSpace;
                                            }
                                        }

                                        if(movingLegendOriginX > maxLegendXCoord && lctx == undefined){ //we have to overflow
                                            console.warn('keepOnSinglePage: '+keepOnSinglePage);
                                            lctx = app.export.createLegendCanvas();
                                            keepOnSinglePage = false;
                                            movingLegendOriginY=50;
                                            movingLegendOriginX=20;
                                        }

                                        if(keepOnSinglePage){
                                            ctx.drawImage(im, movingLegendOriginX, movingLegendOriginY);
                                        } else {
                                            lctx.drawImage(im, movingLegendOriginX, movingLegendOriginY);
                                        }

                                        movingLegendOriginY += im.height+10;

                                        processor(i);
                                    };

                                    im.src = element.canvas.toDataURL();

                                    break;

                                case 'north_arrow':
                                    ctx.drawImage(element.canvas, mainCanvas.width-75, mainCanvas.height-115, 60, 60);
                                    processor(i);
                                    break;

                            }

                            app.export.button.setProgress(elements.length/i);
                        
                        }

                        for(var arg in arguments[0]){
                            elements.push(arguments[0][arg])
                        }

                        processor(0);

                    });
                }
            });
        },
        pdf: function(canvas, legend) {

            var image = new Image();

            image.src = canvas.toDataURL();

            image.onload = function(){
                if (typeof jsPDF == 'undefined') {
                    $.getScript('js/vendor/jspdf.min.js').then(function() {
                        makePDF();
                    })
                } else {
                    makePDF()
                }
            }

            function makePDF(){

                var layout = $('[name="grpLayout"]:checked').val().toLowerCase();
                var size = $('[name="grpSize"]:checked').val().toLowerCase();

                var dims = (size=='large') ? [792,1224] : [612, 792];

                var doc = new jsPDF(layout, 'pt', dims);

                 /*disclaimer*/
                var today = new Date();
                var date = today.toISOString().substring(0, 10);

                var dc1='Created '+date+', by City of Gresham.';
                var dc2='City of Gresham provides no warranty,';
                var dc3='expressed or implied as to the accuracy,';
                var dc4='reliability or completeness of this data.';

                doc.setFontSize(7);
                doc.setTextColor(100,100,100);

                if(layout==='portrait'){
                    if(size==='small' ){
                        doc.text(430, 730, dc1);
                        doc.text(430, 738, dc2);
                        doc.text(430, 746, dc3);
                        doc.text(430, 754, dc4);
                    } else if (size==='large'){
                        doc.text(615, 1140, dc1);
                        doc.text(615, 1148, dc2);
                        doc.text(615, 1156, dc3);
                        doc.text(615, 1164, dc4);
                    }
                } else if(layout==='landscape'){
                    if(size==='small' ){
                        doc.text(600,562, dc1);
                        doc.text(600,570, dc2);
                        doc.text(600,578, dc3);
                        doc.text(600,586, dc4);
                    } else if (size==='large'){
                        doc.text(1000,732, dc1);
                        doc.text(1000,740, dc2);
                        doc.text(1000,748, dc3);
                        doc.text(1000,756, dc4);
                    }
                }

                doc.addImage(image, 'PNG', 25, 25, canvas.width*.7, canvas.height*.7);

                if($('#chk-parcel-data').is(':checked')){

                    var res=doc.autoTableHtmlToJson(document.getElementById('pi'))

                    doc.autoTable(res.columns, res.data, {

                        startY: (size==="small") ? 425 : 790,
                        startX: 10,
                        drawHeaderRow: function(row, data) {
                          row.height = 20;
                        },
                        drawRow: function(row, data) {
                            
                            //could add some more logic here to actually test the 
                            // length of the string or whatevetr..
                            if(row.raw[0] !== 'Legal' && row.raw[0] !== 'Owner'){
                                row.height=14;
                            }

                          if (row.index === 0) return false;
                        },
                        margin: 27,
                        tableWidth:300,
                        styles: {
                          overflow: 'linebreak',
                          cellPadding: 2,
                          fontSize: 10,
                          tableWidth: 'auto',
                          columnWidth: 'auto',
                        },
                        columnStyles: {
                          1: {
                            columnWidth: 'auto'
                          }
                        }
                    });
                }

                //if we had to overflow the legend onto another page, add it to the PDF here
                if(app.export.legendCanvas !== undefined){

                    doc.addPage();

                    var limage = new Image();

                    limage.onload = function(){
                        doc.addImage(limage, 'PNG',25, 25, limage.width*.7, limage.height*.7);
                        doc.save('export.pdf');
                    }

                    limage.src = app.export.legendCanvas.toDataURL('image/png');

                } else {
                    doc.save('export.pdf');
                }
                app.export.button.stop()
            }

            function makePDFLegend(){

                //combinations
                //size and layout

                //8.5 x 11

                //landscape

                //11 x 17

                //Parcel grid

            }
        },

        cleanup: function(){
            $('#exportImage').attr('src', '');
            $('.export-title').remove();
            app.export.cropper.destroy();
        },
        createLegendCanvas: function(height){

            app.export.legendCanvas = document.createElement('canvas');
            var size = $('[name="grpSize"]:checked').val().toLowerCase();
            var layout = $('[name="grpLayout"]:checked').val().toLowerCase(),
                lctx;

            if(app.export.mode !== 'IMAGE'){
                switch(layout){

                    case 'portrait':
                        switch(size){
                            case 'small':
                                app.export.legendCanvas.width  = 768;
                                app.export.legendCanvas.height = 1008;
                                break;
                            case 'large':
                                app.export.legendCanvas.width  = 1008;
                                app.export.legendCanvas.height = 1584;
                                break;
                            }
                        break;

                    case 'landscape':
                        switch(size){
                            case 'small':
                                app.export.legendCanvas.width  = 1008;
                                app.export.legendCanvas.height = 768;
                                break
                            case 'large':
                                app.export.legendCanvas.width  = 1584;
                                app.export.legendCanvas.height = 1008;
                                break
                        }
                        break;
                }
            } else {
                app.export.legendCanvas.width = Math.min(320, app.export.cropper.getData().width);
                app.export.legendCanvas.height = height;
            }

            lctx = app.export.legendCanvas.getContext('2d')

            return lctx;

        },

        calcTextHeight: function(ctx, text, maxWidth, lineHeight){
            var words = text.split(' ');
            var lines = 1, line = '';
            for(var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = ctx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines += 1;
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            return lines;
        },

        wrapCanvasText: function(context, text, x, y, maxWidth, lineHeight) {
            
            context.fillStyle = '#111111';
            context.font = "13px 'Arial'";

            var words = text.split(' ');
            var line = '';

            for(var n = 0; n < words.length; n++) {

              var testLine = line + words[n] + ' ';
              var metrics = context.measureText(testLine);
              var testWidth = metrics.width;

              if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
              }
              else {
                line = testLine;
              }
            }
            context.fillText(line, x, y);

            return y+3
        },

        renderCanvasLegend: function(name, legend){
            
            var canvas= document.createElement('canvas');

            var ctx  = canvas.getContext('2d');

            var titleHeightLines = app.export.calcTextHeight(ctx, name, 121, 19);

            var increment = legend[0].height*.75;

            //how tall are each of the labels.

            var offset=titleHeightLines

            var fullHeight =titleHeightLines * 18;

            legend.forEach(function(symbol){
                var linesHigh = app.export.calcTextHeight(ctx, symbol.label, 140-41, 19)
                fullHeight += 19 * linesHigh;
            })

            canvas.height = fullHeight+5;

            canvas.width = 180;

            app.export.wrapCanvasText(ctx, name, 5, 14, 150, increment);

            //we really have no clue how tall to make the canvas...
            var offset=titleHeightLines*increment+4;

            legend.forEach(function (symbol) {
                var im = new Image();
                im.src = 'data:image/png;base64,'+symbol.imageData;
                ctx.drawImage(im, 10, offset, im.height, im.width);
                ctx.fillStyle = '#111111';
                ctx.font = "10px 'Arial'";
                offset = app.export.wrapCanvasText(ctx, symbol.label, 41, offset+19-3, 140, 19)
            });

            return canvas;

        }
    }