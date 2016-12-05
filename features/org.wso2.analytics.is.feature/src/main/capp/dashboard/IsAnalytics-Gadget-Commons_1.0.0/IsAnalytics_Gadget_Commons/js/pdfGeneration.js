/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

(function($, window, document) {

    var pdfGenButton = function ( settings ){

        settings.aoInitComplete.push( {
            "fn": function ( settings ) {

                var dt = new $.fn.dataTable.Api(settings);

                var sTableWrap = settings.nTableWrapper;
                var visibility="";
                if(dt.ajax.json().data.length==0){
                    visibility="hidden"
                }
                $(sTableWrap).find("div.dataTablesTop").append('<button style="float:right;visibility:' +visibility +
                                        '" data-view="grid" class="btn btn-primary pdfDownload-button"><i class="fw fw-pdf add-margin-right-1x"></i>Export</button>');

                $('.pdfDownload-button').unbind().click(function(){
                    generatePdf(dt, settings.oInit.pdfExport );
                });

            }
        } );
    };

    $.fn.dataTableExt.aoFeatures.push( {
        "fnInit": function( settings ) {
             new pdfGenButton( settings );
        },
        "cFeature": "P",
        "sFeature": "pdfExport"
    });

})(jQuery, window, document);

function generatePdf( table, pdfDataProvider ) {
    var length = 5000;
    var param = table.ajax.params();
    param.start = 0;
    param.length = length;
    $.ajax({
        "url" : table.ajax.url(),
        "data" :param,
        success: function (d) {
            if(d.data.length==0){
                throw "Error - No data to download";
            }
            var doc = new jsPDF('p', 'pt');
            doc.addImage(pdfConfig["pdfStampImage"], 'JPEG', 40, 10, 120, 55);
            doc.addImage(pdfConfig["pdfThemeColorImage"], 'JPEG', 545, 0, 50, 60);
            doc.setFontSize(10);
            doc.setFontType("bold");

            var pdfColsAndInfo = new pdfDataProvider.pdfColsAndInfo();
            var pdfInfo = pdfColsAndInfo.getPdfTableInfo(length,d.recordsTotal);

            doc.text(295, 90, pdfInfo.title , null, null, 'center');
            doc.setFontSize(8);

            doc.text(40, 110, pdfInfo.headerInfo , null, null);

            var pdfRows = d.data;

            if(pdfColsAndInfo.renderRows != undefined )
                pdfRows=pdfColsAndInfo.renderRows(d.data);


            doc.autoTable(pdfColsAndInfo.getPdfTableColumns(), pdfRows, pdfConfig.pdfTableStyles);

            if(pdfInfo.totalRecords > length){
                doc.text("Showing only " + length+ " records out of " + pdfInfo.totalRecords +"records", 40, doc.autoTableEndPosY() + 30);
            }
            doc.save(pdfInfo.fileName + ".pdf");
        }
    });
};