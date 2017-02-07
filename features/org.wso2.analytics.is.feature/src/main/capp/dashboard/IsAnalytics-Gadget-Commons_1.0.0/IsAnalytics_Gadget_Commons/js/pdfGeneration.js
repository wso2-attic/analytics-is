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

    var pdfGenButton = function(settings) {

        settings.aoDrawCallback.push({
            "fn": function() {
                var dt = new $.fn.dataTable.Api(settings);
                if (dt.ajax.json().data.length == 0) {
                    $(dt.table().container()).find(".pdfDownload-button").prop("disabled", true);
                } else {
                    $(dt.table().container()).find(".pdfDownload-button").prop("disabled", false);
                }
            }
        });

        settings.aoInitComplete.push({
            "fn": function(settings) {

                var dt = new $.fn.dataTable.Api(settings);
                var sTableWrap = settings.nTableWrapper;
                var disabled = "";

                if (dt.ajax.json().data.length == 0) {
                    disabled = "disabled";
                }
                $(sTableWrap).find("div.dataTables_toolbar").append('<button ' + disabled +
                    ' style="float:right;" data-view="grid" class="btn btn-primary pdfDownload-button"><i class="fw fw-pdf add-margin-right-1x"></i>Export</button>');

                $('.pdfDownload-button').unbind().click(function() {
                    generatePdf(dt, settings.oInit.pdfExport);
                });
            }
        });
    };

    $.fn.dataTableExt.aoFeatures.push({
        "fnInit": function(settings) {

            new pdfGenButton(settings);
        },
        "cFeature": "P",
        "sFeature": "pdfExport"
    });

})(jQuery, window, document);

/**
 * Generate PDF
 * @param {Object} table
 * @param {Object} pdfDataProvider
 */
function generatePdf(table, pdfDataProvider) {

    var length = 5000;
    var param = table.ajax.params();
    param.start = 0;
    param.length = length;
    var req = new XMLHttpRequest();
    req.open("GET", table.ajax.url()+"?"+$.param(param) +"&drawPDF=True&"+ pdfDataProvider.pdfInfo().columnArray.join('&') + "&pdfTitle=" + pdfDataProvider.pdfInfo().title, true);
    req.responseType = "blob";
    req.onload = function (event) {
        var blob = req.response;
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = pdfDataProvider.pdfInfo().title.toLowerCase().replace(/ /g,"_") + ".pdf";
        link.click();
    };
    req.send();
}