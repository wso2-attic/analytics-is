var timeFrom;
var timeTo;
var timeUnit = null;
var listnedTimeFromValue;
var listnedTimeToValue;
var oTable;
var page = gadgetUtil.getCurrentPage();
var globalUniqueArray = [];
var TOPIC_USERNAME = "subscriberUser";
var TOPIC_USERPREF_DELETION = "subscriberUserPrefDeletion";
var TOPIC = "subscriber";
var TOPIC_FIRST_LOGIN = "subscriberFirstLogin";
var listnedAdditionalUserPrefs = "";
var firstLoginFilter = "";

$(function() {


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

    if (page.name == TYPE_OVERALL || page.name == TYPE_LOCAL || page.name == TYPE_FEDERATED) {
        var idpFilter = "";


        if(page.name == TYPE_OVERALL) {
            idpFilter = "";
            
        } else if(page.name == TYPE_LOCAL) {
            idpFilter = "LOCAL";

        } else if(page.name == TYPE_FEDERATED) {
            idpFilter = "FEDERATED";
        }

        $.fn.dataTable.ext.errMode = 'none';
        oTable = $('#tblMessages').DataTable({
            scrollY: 500,
            scrollX: true,
            dom: '<"dataTablesTop"' +
                'f' +
                '<"dataTables_toolbar">' +
                '>' +
                'rtP' +
                '<"dataTablesBottom"' +
                'lip' +
                '>',
            "processing": true,
            "serverSide": true,
            "searching": false,
            aaSorting: [],
            "columns" : getColumns(),
            "pdfExport": {
                pdfCols : getPdfTableColumns,
                pdfHeaderInfo : getPdfTableInfo,
                renderRows : getPdfTableRows
            },
            "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
                if ( aData[getAuthenticationColumn()] == true )
                    {
                        $('td', nRow).eq(getAuthenticationColumn()).html(
                            '<div style="text-align: center;"><div style="width:8%;margin:-8px;height:38px;float:left;background-color:#5CB85C;"></div><div style="width: 92%;float:right; padding-left:8px;">Success</div></div>'
                        );
                    }
                    else
                    {
                        $('td', nRow).eq(getAuthenticationColumn()).html(
                            '<div style="text-align: center"><div style="width:8%;margin:-8px;height:38px;float:left;background-color:#D9534F;"></div><div style="width: 92%;float:right;padding-left:8px;">Failure</div></div>'
                        );
                    }
            },
            "ajax": {
                "url" : AUTHENTICATION_CONTEXT,
                "data" : function (d) {
                    d.type = page.type;
                    d.timeFrom = parseInt(listnedTimeFromValue);
                    d.timeTo = parseInt(listnedTimeToValue);
                    d.listnedAdditionalUserPrefs = listnedAdditionalUserPrefs;
                    d.idpType = idpFilter;
                    d.firstLogin = firstLoginFilter;
                }
            }
        });
    } else if(page.name == TYPE_SESSIONS) {
        $.fn.dataTable.ext.errMode = 'none';
        oTable = $('#tblMessages').DataTable({
            scrollY: 600,
            scrollX: true,
            dom: '<"dataTablesTop"' +
                'f' +
                '<"dataTables_toolbar">' +
                '>' +
                'rtP' +
                '<"dataTablesBottom"' +
                'lip' +
                '>',
            "processing": true,
            "serverSide": true,
            "searching": true,
            "language": {
                "search": "",
                "searchPlaceholder": "Search by Username..."
            },
            aaSorting: [],
            "columns" :getColumns(),
            "pdfExport": {
                pdfCols : getPdfTableColumns,
                pdfHeaderInfo : getPdfTableInfo
            },
            "ajax": {
                "url" : SESSION_CONTEXT,
                "data" : function (d) {
                    d.type = page.type;
                    d.timeFrom = parseInt(listnedTimeFromValue);
                    d.timeTo = parseInt(listnedTimeToValue);
                }
            }
        });
        $('#tblMessages_filter input').on('keyup', function () {
            oTable.search( this.value ).draw();
        });
    }

    $('#tblMessages tbody').on('click', 'tr', function() {
        var id = $(this).find("td:first").html();
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            dataTable.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
        /*if( timeUnit == null) {
         timeUnit = qs.timeUnit;
         }*/
        // var targetUrl = MESSAGE_PAGE_URL + "?" + PARAM_ID + "=" + id + "&timeFrom=" + timeFrom + "&timeTo=" + timeTo + "&timeUnit=" + timeUnit;;
        var targetUrl = MESSAGE_PAGE_URL + "?" + PARAM_ID + "=" + id;
        parent.window.location = targetUrl;
    });

});

gadgets.HubSettings.onConnect = function() {

    gadgets.Hub.subscribe(TOPIC, function(topic, data, subscriberData) {
        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        onDataChanged();
    });

    gadgets.Hub.subscribe(TOPIC_USERNAME, function(topic, data, subscriberData) {


        addUserPrefsToGlobalArray(topic,data.mode,data.userPrefValue);
        onDataChanged();
    });

    gadgets.Hub.subscribe(TOPIC_FIRST_LOGIN, function (topic, data, subscriberData) {
        var firstLogin = data.firstLogin;
        if(firstLogin == "enable") {
            firstLoginFilter = " AND isFirstLogin:true";
        } else {
            firstLoginFilter = "";
        }
        onDataChanged();
    });

    gadgets.Hub.subscribe(TOPIC_USERPREF_DELETION, function(topic, data, subscriberData) {

        var index;
        for(i=0;i<globalUniqueArray.length;i++){
            if(globalUniqueArray[i][2] == data.category){
                index = i;
                break;
            }
        }
        globalUniqueArray.splice(index, 1);
        listnedAdditionalUserPrefs = "";

        for(i=0;i<globalUniqueArray.length;i++){
            if(globalUniqueArray[i][2] == "USERNAME"){
                listnedAdditionalUserPrefs+= " AND username:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
                listnedAdditionalUserPrefs+= " AND serviceProvider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "ROLE"){
                listnedAdditionalUserPrefs+= " AND rolesCommaSeparated:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
                listnedAdditionalUserPrefs+= " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "USERSTORE"){
                listnedAdditionalUserPrefs+= " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "REGION"){
                listnedAdditionalUserPrefs+= " AND region:\""+globalUniqueArray[i][1]+"\"";
            }else if (globalUniqueArray[i][2] == "FIRST_TIME_SERVICEPROVIDER") {
                listnedAdditionalUserPrefs += " AND serviceProvider:\"" + globalUniqueArray[i][1] + "\"";
                listnedAdditionalUserPrefs += " AND isFirstLogin:true";
            }
        }

        onDataChanged();
    });
};


function addUserPrefsToGlobalArray(topic,mode,userPref){

    var valExist = false;

    if(globalUniqueArray.length != 0){
        for(i=0;i<globalUniqueArray.length;i++){
            if(globalUniqueArray[i][2] == mode){
                valExist = true;
                globalUniqueArray[i][0] = topic;
                globalUniqueArray[i][1] = userPref;
                break;
            }
        }

        if(!valExist){
            var arry = [topic,userPref,mode];
            globalUniqueArray.push(arry);
        }
    }else{
        var arry = [topic,userPref,mode];
        globalUniqueArray.push(arry);
    }

    listnedAdditionalUserPrefs = "";

    for(i=0;i<globalUniqueArray.length;i++){
        if(globalUniqueArray[i][2] == "USERNAME"){
            listnedAdditionalUserPrefs+= " AND username:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
            listnedAdditionalUserPrefs+= " AND serviceProvider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "ROLE"){
            listnedAdditionalUserPrefs+= " AND rolesCommaSeparated:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
            listnedAdditionalUserPrefs+= " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "USERSTORE"){
            listnedAdditionalUserPrefs+= " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "REGION"){
            listnedAdditionalUserPrefs+= " AND region:\""+globalUniqueArray[i][1]+"\"";
        }else if (globalUniqueArray[i][2] == "FIRST_TIME_SERVICEPROVIDER") {
            listnedAdditionalUserPrefs += " AND serviceProvider:\"" + globalUniqueArray[i][1] + "\"";
            listnedAdditionalUserPrefs += " AND isFirstLogin:true";
        }
    }

}

function onDataChanged() {

    oTable.clear().draw();
    oTable.ajax.reload().draw();
};

function onError(msg) {
    $("#canvas").html(gadgetUtil.getErrorText(msg));
};

function getAuthenticationColumn(){

    var result;
    switch (page.name) {
        case TYPE_OVERALL:
            result = 8;
            break;
        case TYPE_LOCAL:
            result = 8;
            break;
        case TYPE_FEDERATED:
            result = 6;
            break;
        default:
            throw "Error - Unknown page name";
    }
    return result;
}

function getColumns(){

    var result;
    switch (page.name) {
        case TYPE_OVERALL:
            result = [
                    { title: "Context ID" },
                    { title: "User Name" },
                    { title: "Service Provider" },
                    { title: "Subject Step" },
                    { title: "Roles" },
                    { title: "Tenant Domain"},
                    { title: "IP" },
                    { title: "Region" },
                    { title: "Overall Authentication" },
                    { title: "Timestamp" }
            ];
            break;
        case TYPE_LOCAL:
            result = [

                     { title: "Context ID" },
                     { title: "User Name" },
                     { title: "Service Provider" },
                     { title: "Userstore" },
                     { title: "Tenant Domain"},
                     { title: "Roles" },
                     { title: "IP" },
                     { title: "Region" },
                     { title: "Local Authentication" },
                     { title: "Timestamp" }
            ];
            break;
        case TYPE_FEDERATED:
            result = [
                     { title: "Context ID" },
                     { title: "User Name" },
                     { title: "Service Provider" },
                     { title: "Identity Provider" },
                     { title: "IP" },
                     { title: "Region" },
                     { title: "Authentication Step Success" },
                     { title: "Timestamp" }
            ];
            break;
        case TYPE_SESSIONS:
            result =  [
                     { title: "Session ID", visible: false },
                     { title: "Username" },
                     { title: "Start Time" },
                     { title: "Termination Time" },
                     { title: "End Time" },
                     { title: "Duration (ms)" },
                     { title: "Is Active" },
                     { title: "Userstore Domain" },
                     { title: "Tenant Domain" },
                     { title: "IP" },
                     { title: "Remember Me Flag" },
                     { title: "Timestamp" }

            ];
            break;
        default:
            throw "Error - Unknown page name";
    }
    return result;
}


function getPdfTableColumns(columns) {

    var i = 0;
    var columns = getColumns();
    return columns.map(function(column) {

        column["dataKey"] = i;
        i++;
        return column;
    });
}

function getPdfTableInfo(maxRecords, totalRecords) {

    var pdfInfo = {};
    switch (page.name) {
        case TYPE_OVERALL:
            pdfInfo["title"] = "OVERALL LOGIN ATTEMPTS";
            break;
        case TYPE_LOCAL:
            pdfInfo["title"] = "LOCAL LOGIN ATTEMPTS";
            break;
        case TYPE_FEDERATED:
            pdfInfo["title"] = "FEDERATED LOGIN ATTEMPTS";
            break;
        case TYPE_SESSIONS:
            pdfInfo["title"] = "LOGIN SESSIONS";
            break;
        default:
            throw "Error - Unknown Page name";
    }

    pdfInfo["headerInfo"] = "Starting Date   : " + renderDateTime(parseInt(listnedTimeFromValue)) + "\n\nEnding Date    : " + renderDateTime(parseInt(listnedTimeToValue)) + "\n\nTotal Records : " + totalRecords;
    pdfInfo["fileName"] = pdfInfo.title.toLowerCase().replace(/ /g, "_");
    pdfInfo["maxRecords"] = maxRecords;
    pdfInfo["totalRecords"] = totalRecords;
    return pdfInfo;
}

function renderDateTime(data, type, row) {

    var date = new Date(data);
    return date.toLocaleString(moment.locale());
}


function getPdfTableRows(rawData) {

    return rawData.map(function(record) {

        var columnData = getColumns();
        var newRecord = {};
        for (i = 0; i < columnData.length; i++) {
            if (i == getAuthenticationColumn()) {
                if (record[getAuthenticationColumn()] == true) {
                    newRecord[getAuthenticationColumn()] = "Success";
                } else {
                    newRecord[getAuthenticationColumn()] = "Failure";
                }
                continue;

            }
            newRecord[i] = record[i];
        }
        return newRecord;
    });
}
