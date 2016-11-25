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

        gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
        gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());

    var columns = [
        { data: "display", title: "Alert Type",
            "render": function(data, type, row) {
                return '<div class="row"><span class="col-xs-4">' + data + '</span></div>';
            }
        },
        { data: "count", title: "Count" },
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

    gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
    gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());

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

