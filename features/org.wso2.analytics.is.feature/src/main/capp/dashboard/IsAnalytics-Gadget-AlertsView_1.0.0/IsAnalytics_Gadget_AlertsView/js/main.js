
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
    { data: "timestamp", title: "Timestamp",
        "render": function(data, type, row) {
            var date = new Date(data);
            return date.toLocaleString("en-US");
        }
    },
    { data: "message", title: "Message" },
    { data: "alertType", title: "Alert Type",
        "render": function(data, type, row) {
            return '<div class="row"><div class="col-xs-2 alert-type-common alert-type-'+data+'"></div><span class="col-xs-2">'+data+'</span></div>';
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
    gadgets.Hub.subscribe(TOPIC_ALERT_TYPE, function(topic, data, subscriberData) {
        selectedAlertType = data.alertType;
        onDataChanged();
    });
};

