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

var TOPIC_DATE_RANGE = "subscriberDateRange";
var TOPIC_ALERT_TYPE = "publisherAlertType";
var listnedTimeFromValue;
var listnedTimeToValue;
var alertType;
var oTable;

var ALERTS_CONTEXT = "/portal/apis/isanalytics-alerts";
$(document).ready(function () {

    var historyParmExist = gadgetUtil.getURLParam("persistTimeFrom");

    if(historyParmExist == null){
        listnedTimeFromValue = gadgetUtil.timeFrom();
        listnedTimeToValue = gadgetUtil.timeTo();
    }else{
        var historyParms = gadgetUtil.getURLParams();

        for (var key in historyParms) {
            if (historyParms.hasOwnProperty(key)) {

                if(key == "persistTimeFrom"){
                    listnedTimeFromValue = historyParms[key];
                }else if(key == "persistTimeTo"){
                    listnedTimeToValue = historyParms[key];
                }else if(Object.keys(historyParms).length > 2){
                    var historyParamVal = historyParms[key].toString();
                    addUserPrefsToGlobalArray("Topic",key,historyParamVal.split("_")[0]);
                }
            }
        }
    }

    var columns = [
        { data: "display", title: "Alert Type",
            "render": function(data, type, row) {
                return '<div class="row"><span class="col-xs-2">' + data + '</span></div>';
            }
        },
        { data: "count", title: "Count" },
        { title: "Export to PDF", "fnCreatedCell": function (nTd) {
                                        $(nTd).html("<a href=javascript:exportToPDF()><i class='fw fw-pdf'></i> Export</a>");
                                 }
        }
    ] ;

    $.fn.dataTable.ext.errMode = 'none';
    oTable = $('#tblAlerts').DataTable({
        scrollY: 100,
        scrollX: true,
        dom: '<"dataTablesTop"' +
        'f' +
        '<"dataTables_toolbar">' +
        '>' +
        'rt',
        "processing": true,
        "serverSide": true,
        "searching": false,
        aaSorting: [],
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": [ "_all" ] }
        ],
        "columns" : columns,
        "ajax": {
            "url" : ALERTS_CONTEXT,
            "data" : function (d) {
                d.query = "summery",
                    d.timeFrom = parseInt(listnedTimeFromValue);
                d.timeTo = parseInt(listnedTimeToValue);
            }
        }
    });
    $('#tblAlerts tbody').on('click', 'tr', function () {
        var data = oTable.row( this ).data();
        var key = data.key;
        var publishData = {};
        publishData.alertType = key;
        alertType = key;
        if(key != null) {
            gadgets.Hub.publish(TOPIC_ALERT_TYPE, publishData);
        }

    } );
    $('#tblAlerts tbody').on( 'click', 'tr', function () {
        oTable.$('tr.selected').removeClass('selected');
        if ( !$(this).hasClass('selected') ) {
            $(this).addClass('selected');
        }
    } );
});


function onDataChanged() {
    oTable.clear();
    oTable.ajax.reload().draw();
};

gadgets.HubSettings.onConnect = function() {

    gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function(topic, data, subscriberData) {
        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        onDataChanged();
    });
};

function exportToPDF() {

     $.ajax({
        "url" : ALERTS_CONTEXT,
        "data" :{
            draw : 1,
            alertType:alertType,
            timeFrom:parseInt(listnedTimeFromValue),
            timeTo:parseInt(listnedTimeToValue),
            start:0,
            length:200

        },
        success: function (d) {

            var doc = new jsPDF('p', 'pt');
            doc.addImage(gadgetConfig.pdfStampImage, 'JPEG', 40, 10, 120, 55);
            doc.addImage(gadgetConfig.pdfThemeColorImage, 'JPEG', 545, 0, 50, 60);
            doc.setFontSize(10);
            doc.setFontType("bold");
            doc.text(295, 90, "SECURITY ALERT REPORT OF " + getAlertName(alertType), null, null, 'center');
            doc.setFontSize(8);

            doc.text(40, 110, "Starting Date   : " + renderDateTime(listnedTimeFromValue) + "\n\nEnding Date    : " + renderDateTime(listnedTimeToValue) +
                        "\n\nTotal Records : "+d.recordsTotal, null, null);


            var columns = [
                     {"title": "Timestamp", "dataKey": "timestamp"},
                     {"title": "Tenant Domain", "dataKey": "tenantDomain"},
                     {"title": "User", "dataKey": "username"},
                     {"title": "Message", "dataKey": "msg"}
            ];

            var rows = d.data.map(function(obj){
                var row ={"timestamp":"","tenantDomain":"","username":"","msg":""};
                row["timestamp"]=renderDateTime(obj.timestamp);
                row["tenantDomain"]=obj.tenantDomain;
                row["username"]=obj.username;
                row["msg"]=obj.msg;
                return row;
            });

            doc.autoTable(columns, rows, gadgetConfig.pdfTableStyles);
            doc.save("Security Alert Report.pdf");

        }
    });
}

function getAlertName(alertType){
    switch (alertType){
        case "SuspiciousLoginAlert":
            return "SUSPICIOUS LOGINS";

        case "AbnormalLongSessionAlert":
            return "ABNORMAL LONG SESSIONS";

        case "AbnormalRefreshAlert":
            return "ABNORMAL REFRESHES";

    }
}

function renderDateTime(data, type, row) {
      var date = new Date(data);
      return date.toLocaleString("en-US");
}