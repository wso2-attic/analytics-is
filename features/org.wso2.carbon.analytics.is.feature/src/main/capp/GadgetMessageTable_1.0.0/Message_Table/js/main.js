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
var listnedAdditionalUserPrefs = "";

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

    if(page.name == TYPE_LANDING) {
        oTable = $('#tblMessages').DataTable({
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
            "columns" : [
                { title: "User Name" },
                { title: "Service Provider" },
                { title: "Identity Provider" },
                { title: "Roles" },
                { title: "Ip" },
                { title: "Authentication Success" },
                { title: "Timestamp" }

            ],
            "ajax": {
                "url" : CONTEXT,
                "data" : function (d) {
                    d.type = page.type;
                    d.timeFrom = parseInt(listnedTimeFromValue);
                    d.timeTo = parseInt(listnedTimeToValue);
                    d.listnedAdditionalUserPrefs = listnedAdditionalUserPrefs;
                }
            }
        });
    } else if(page.name == TYPE_RESIDENT_IDP) {
        oTable = $('#tblMessages').DataTable({
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
            "columns" : [
                { title: "User Name" },
                { title: "Service Provider" },
                { title: "Userstore" },
                { title: "Roles" },
                { title: "Ip" },
                { title: "Authentication Success" },
                { title: "Timestamp" }

            ],
            "ajax": {
                "url" : CONTEXT,
                "data" : function (d) {
                    d.type = page.type;
                    d.timeFrom = parseInt(listnedTimeFromValue);
                    d.timeTo = parseInt(listnedTimeToValue);
                    d.listnedAdditionalUserPrefs = listnedAdditionalUserPrefs;
                }
            }
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
                listnedAdditionalUserPrefs+= " AND _userName:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
                listnedAdditionalUserPrefs+= " AND _serviceprovider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "ROLE"){
                listnedAdditionalUserPrefs+= " AND rolesCommaSeperated:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
                listnedAdditionalUserPrefs+= " AND _identityProvider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "USERSTORE"){
                listnedAdditionalUserPrefs+= " AND _userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
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
            listnedAdditionalUserPrefs+= " AND _userName:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
            listnedAdditionalUserPrefs+= " AND _serviceprovider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "ROLE"){
            listnedAdditionalUserPrefs+= " AND rolesCommaSeperated:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
            listnedAdditionalUserPrefs+= " AND _identityProvider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "USERSTORE"){
            listnedAdditionalUserPrefs+= " AND _userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
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