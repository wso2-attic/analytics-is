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
var TOPIC_ALERT_TYPE = "subscriberAlertType";
var listnedTimeFromValue;
var listnedTimeToValue;
var selectedAlertType;

var oTable;

var ALERTS_CONTEXT = "/portal/apis/isanalytics-alerts";
$(document).ready(function () {

    var page = gadgetUtil.getCurrentPageName();

    var historyParmExist = gadgetUtil.getURLParam("persistTimeFrom");
    var historyAlertType = gadgetUtil.getURLParam("alertType");


    if(historyParmExist == null){
        listnedTimeFromValue = gadgetUtil.timeFrom();
        listnedTimeToValue = gadgetUtil.timeTo();
        var historyParms = gadgetUtil.getURLParams();
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

    gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
    gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());

    if(historyAlertType) {
        selectedAlertType = historyAlertType;
    }
    if(!selectedAlertType) {

      if(page == "suspiciousloginalert"){
         selectedAlertType = "SuspiciousLoginAlert";
      } else if(page == "abnormallongsessionalert"){
         selectedAlertType = "AbnormalLongSessionAlert";
      }

    }

    var columns = getColumns(selectedAlertType);

    $.fn.dataTable.ext.errMode = 'none';
    oTable = createDataTable(columns, true);

    oTable.draw();
});

function createDataTable(columns, destroy) {

    var dataTable = $('#tblAlerts').DataTable({
        scrollY: 300,
        scrollX: true,
        dom: '<"dataTablesTop"' +
        'f' +
        '<"dataTables_toolbar">' +
        '>P' +
        'rt' +
        '<"dataTablesBottom"' +
        'lip' +
        '>',
        "processing": true,
        "serverSide": true,
        "searching": false,
        aaSorting: [],
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": [ "_all" ] }
        ],
        "columns" : columns,
        "pdfExport": {
                        pdfColsAndInfo:getPdfTableColsAndInfo,
                        renderRows:getPdfTableRows
                },
        "initComplete": function( settings, json ) {
            //$('[data-toggle="tooltip"]').tooltip();
        },
        "bDestroy" : true,
        "ajax": {
            "url" : ALERTS_CONTEXT,
            "data" : function (d) {
                if(selectedAlertType) {
                    d.alertType = selectedAlertType;
                }
                d.timeFrom = parseInt(listnedTimeFromValue);
                d.timeTo = parseInt(listnedTimeToValue);
            }
        }
    });
    return dataTable;
}
function getColumns(alertType) {
    var result;
    switch (alertType) {
        case "AbnormalLongSessionAlert":
            result = [
                {
                    data: "timestamp", title: "Timestamp",
                    "render": renderDateTime
                },
                {data: "tenantDomain", title: "Tenant Domain"},
                {data: "username", title: "User"},
                {data: "duration", title: "Duration"},
                {data: "avgDuration", title: "Avg. Duration"}
            ]
            break;
        case "SuspiciousLoginAlert":
            result = [
                {
                    data: "timestamp", title: "Timestamp",
                    "render": renderDateTime
                },
                {data: "tenantDomain", title: "Tenant Domain"},
                {data: "username", title: "User"},
                {data: "msg", title: "Message"}
            ]
            break;
        case "All":
        default:
            result = [
                {
                    data: "timestamp", title: "Timestamp",
                    "render": renderDateTime
                },
                {data: "msg", title: "Message"},
                {
                    data: "alertType", title: "Alert Type",
                    "render": function (data, type, row) {
                        return '<div class="row"><span class="col-xs-2">' + data + '</span></div>';
                    }
                }
            ]
            break;
    }
    return result;
}

function renderDateTime(data, type, row) {
    var date = new Date(data);
    return date.toLocaleString("en-US");
}

function onTypeChanged() {
    oTable.destroy(true);
    $('#canvas').html('<table id="tblAlerts" class="table table-striped table-bordered dataTable no-footer" cellspacing="0" width="100%"/>');
    oTable = createDataTable(getColumns(selectedAlertType), true);
    oTable.redraw();
    oTable.ajax.reload();
};

function onDataChanged() {
    gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
    gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());
    oTable.ajax.reload();
};

gadgets.HubSettings.onConnect = function() {

    gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function(topic, data, subscriberData) {
        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        onDataChanged();
    });
    gadgets.Hub.subscribe(TOPIC_ALERT_TYPE, function(topic, data, subscriberData) {
        selectedAlertType = data.alertType;
        gadgetUtil.updateURLParam("alertType", selectedAlertType);
        onTypeChanged();
    });
};

function getPdfTableColsAndInfo(){
    this.getPdfTableColumns= function(){
        var columns = getColumns(selectedAlertType);
        return columns.map(function (column){
            var newColumn = {};
            newColumn["title"] = column["title"];
            newColumn["dataKey"] = column["data"];
            return newColumn;
        });
    }




    this.getPdfTableInfo = function(maxRecords,totalRecords){
        var pdfInfo = {};
        switch (selectedAlertType){

            case "SuspiciousLoginAlert":
                pdfInfo["title"] = "SECURITY ALERT REPORT OF SUSPICIOUS LOGINS";
                break;
            case "AbnormalLongSessionAlert":
                pdfInfo["title"] =  "SECURITY ALERT REPORT OF ABNORMAL LONG SESSIONS";
                break;
            default :
                throw "Error - Alert Type is not defined";
        }

        pdfInfo["headerInfo"] = "Starting Date   : " + renderDateTime(listnedTimeFromValue) + "\n\nEnding Date    : " + renderDateTime(listnedTimeToValue) +
                                          "\n\nTotal Records : "+totalRecords;

        pdfInfo["fileName"]="Security Alert Report";
        pdfInfo["maxRecords"]= maxRecords;
        pdfInfo["totalRecords"]= totalRecords;
        return pdfInfo;
    }
}
function getPdfTableRows(rawData) {
    return rawData.data.map(function(record){
        columnData = getColumns(selectedAlertType);
        var newRecord = {};
        for(i = 0; i<columnData.length;i++){
            if(columnData[i].data=="timestamp"){
                newRecord["timestamp"]=renderDateTime(record["timestamp"]);
            }
            else{
                newRecord[columnData[i].data] = record[columnData[i].data];
            }
        }
        return newRecord;
    });
}