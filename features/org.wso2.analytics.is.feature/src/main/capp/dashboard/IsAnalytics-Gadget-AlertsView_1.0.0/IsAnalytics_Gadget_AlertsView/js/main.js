
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

    var historyParmExist = gadgetUtil.getURLParam("persistTimeFrom");
    var historyAlertType = gadgetUtil.getURLParam("alertType");

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


    if(historyAlertType) {
        selectedAlertType = historyAlertType;
    }
    if(!selectedAlertType) {
        selectedAlertType = "All";
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
        '>' +
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
        case "AbnormalRefreshAlert":
            result = [
                { data: "timestamp", title: "Timestamp",
                    "render": renderDateTime},
                { data: "userId", title: "User ID" },
                { data: "tenantDomain", title: "Tenant Domain" },
                { data: "scope", title: "Scope" },
                { data: "consumerKey", title: "Key" },
                { data: "message", title: "Message" }
            ]
            break;
        case "AbnormalLongSessionAlert":
            result = [
                { data: "timestamp", title: "Timestamp",
                    "render": renderDateTime},
                { data: "sessionId", title: "Session ID" },
                { data: "username", title: "User" },
                { data: "duration", title: "Duration" ,
                    "render": renderDateTime},
                { data: "avgDuration", title: "Avg. Duration",
                    "render": renderDateTime}
            ]
            break;
        case "SuspiciousLoginAlert":
            result = [
                { data: "timestamp", title: "Timestamp",
                    "render": renderDateTime},
                { data: "sessionId", title: "Session ID" },
                { data: "username", title: "User" },
                { data: "message", title: "Message" },
                { data: "tenantDomain", title: "Tenant Domain" }
            ]
            break;
        case "All":
        default:
            result = [
                { data: "timestamp", title: "Timestamp",
                    "render": renderDateTime},
                { data: "message", title: "Message" },
                { data: "alertType", title: "Alert Type",
                    "render": function(data, type, row) {
                        return '<div class="row"><div class="col-xs-2 alert-type-common alert-type-'+data+'"></div><span class="col-xs-2">'+data+'</span></div>';
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

