var TOPIC_DATE_RANGE = "subscriber";
var TOPIC_USERNAME = "subscriberUser";
var TOPIC_USERPREF_DELETION = "subscriberUserPrefDeletion";
var TOPIC_SLIDER = "publisherSliderDateRange";
var TOPIC_REGION = "publisherRegion";
var listnedTimeFromValue;
var listnedTimeToValue;
var listnedAdditionalUserPrefs = "";
var globalUniqueArray = [];
var rangeStart;
var rangeEnd;
var rangeHistoryArray = [];
var idpTypeFilter = "";

var page = gadgetUtil.getCurrentPageName();
var qs = gadgetUtil.getQueryString();
var prefs = new gadgets.Prefs();
var type;
var chart = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE));
var map;

if (chart) {
    type = gadgetUtil.getRequestType(page, chart);
}


$(function() {

    if (!chart) {
        $("#canvas").html(gadgetUtil.getErrorText("Gadget initialization failed. Gadget role must be provided."));
        return;
    }
    if (page != TYPE_LANDING && page != TYPE_RESIDENT_IDP && qs[PARAM_ID] == null) {
        $("#canvas").html(gadgetUtil.getDefaultText());
        return;
    }

    if(page == TYPE_RESIDENT_IDP) {
        idpTypeFilter = " AND identityProviderType:\"LOCAL\"";
    } else {
        idpTypeFilter = " AND identityProviderType:\"FEDERATED\"";
    }

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

    onDataChanged();

    $("#back").off().click(function (event) {
        if(rangeHistoryArray.length > 0) {
            var timeRange = rangeHistoryArray[rangeHistoryArray.length - 1];
            rangeHistoryArray.splice(rangeHistoryArray.length - 1, 1);
            listnedTimeFromValue = timeRange[0];
            listnedTimeToValue = timeRange[1];
            var message = {
                timeFrom: listnedTimeFromValue,
                timeTo: listnedTimeToValue,
                timeUnit: "Custom"
            };
            gadgets.Hub.publish(TOPIC_SLIDER, message);
            onDataChanged();

            if(rangeHistoryArray.length == 0) {
                $(this).hide();
            }
        }
    });

    checkMapType();
});

function checkMapType() {
    if (document.getElementById('chkMap').checked) {
        $("#mapFailDiv").hide();
        $("#mapSuccessDiv").show()
        map.colorCode = "SUCCESS";
    } else {
        $("#mapSuccessDiv").hide();
        $("#mapFailDiv").show();
        map.colorCode = "FAILURE";
    }
}

gadgets.HubSettings.onConnect = function() {

    gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function(topic, data, subscriberData) {

        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        onDataChanged();
        $("#back").hide();
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
                listnedAdditionalUserPrefs+= " AND userName:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
                listnedAdditionalUserPrefs+= " AND serviceprovider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "ROLE"){
                listnedAdditionalUserPrefs+= " AND rolesCommaSeperated:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
                listnedAdditionalUserPrefs+= " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "REGION"){
                listnedAdditionalUserPrefs+= " AND region:\""+globalUniqueArray[i][1]+"\"";
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
            listnedAdditionalUserPrefs+= " AND userName:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
            listnedAdditionalUserPrefs+= " AND serviceprovider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "ROLE"){
            listnedAdditionalUserPrefs+= " AND rolesCommaSeperated:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
            listnedAdditionalUserPrefs+= " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "REGION"){
            listnedAdditionalUserPrefs+= " AND region:\""+globalUniqueArray[i][1]+"\"";
        }
    }
}



function onDataChanged() {

    gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
    gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());

    gadgetUtil.fetchData(CONTEXT, {
        type: type,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs: listnedAdditionalUserPrefs,
        idpType:idpTypeFilter
    }, onData, onError);

    gadgetUtil.fetchData(CONTEXT, {
        type: 25,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs: listnedAdditionalUserPrefs,
        idpType:idpTypeFilter,
        start:0,
        count:10
    }, loadMap, onError);

};


function onData(response) {
    try {
        var data = response.message;
        /*if (data.length == 0) {
         $('#canvas').html(gadgetUtil.getEmptyRecordsText());
         return;
         }*/
        //sort the timestamps
        data.sort(function(a, b) {
            return a.timestamp - b.timestamp;
        });

        //perform necessary transformation on input data

        var allData = chart.processData(data);
        var message = {
            success: allData[1],
            failed: allData[2]
        };

        //gadgets.Hub.publish(TOPIC_STAT_PUBLISHER, message);
        loadStats(message);

        var callbackmethod = function(start, end) {
            rangeStart = start;
            rangeEnd = end;
        };

        chart.schema[0].data = allData[0];
        //finally draw the chart on the given canvas
        chart.chartConfig.width = $("#canvas").width();
        chart.chartConfig.height = $("#canvas").height();

        var vg = new vizg(chart.schema, chart.chartConfig);
        $("#canvas").empty();
        vg.draw("#canvas",[{type:"range", callback:callbackmethod}]);
    } catch (e) {
        $('#canvas').html(gadgetUtil.getErrorText(e));
    }
}

function onError(msg) {
    $("#canvas").html(gadgetUtil.getErrorText(msg));
};

function loadStats(data){

    var successCount = data.success;
    var failed = data.failed;
    var total = successCount + failed;

    $('#gadget-messge').hide();
    $('#stats').show();
    var success = total - failed;
    var failedPct = (failed / total) * 100;
    var successPct = 100 - failedPct;

    $("#totalCount").html(total);
    $("#failedCount").html(failed);
    $("#failedPercent").html(parseFloat(failedPct).toFixed(2));
    $("#successCount").html(success);
    $("#successPercent").html(parseFloat(successPct).toFixed(2));

    var successColor = function(){
        return parseFloat(successPct) > 0 ? '#5CB85C' : '#353B48';
    };

    var failColor = function(){
        return parseFloat(failedPct) > 0 ? '#D9534F' : '#353B48';
    };

//draw donuts
    var dataT = [{
        "metadata": {
            "names": ["Rate", "Status"],
            "types": ["linear", "ordinal"]
        },
        "data": [
            [parseFloat(success), "Success"],
            [parseFloat(failed), "Failure"]
        ]
    }];

    var configT = {
        charts: [{ type: "arc", x: "Rate", color: "Status", mode:"donut" }],
        innerRadius: 0.3,
        padding: { top:0, right:70, bottom:0, left:10 },
        legend: true,
        percentage: true,
        colorScale: [successColor(), failColor()],
        width: 260,
        height: 160
    }

    var chartT = new vizg(dataT, configT);
    chartT.draw("#donutDiv");
}

function loadMap(data) {
    var successData = [];
    var failedData = [];


    var mapCallBack = function(event, item) {
        if (item != null) {
            var region = item.datum.zipped.unitName;
            map.mode = "REGION";

            var message = {
                userPrefValue: region,
                mode: map.mode,
                colorCode:map.colorCode
            };

            gadgetUtil.updateURLParam(map.mode, region + "_" +map.colorCode);

            gadgets.Hub.publish(TOPIC_REGION, message);
        }
    }


    for (var i = 0 ; i < data.message.length; i++) {
        successData.push([data.message[i].region, data.message[i].authSuccessCount]);
        failedData.push([data.message[i].region, data.message[i].authFailureCount]);
    }


    var worldSuccessData =  [
        {
            "metadata" : {
                "names" : ["Country","Logins"],
                "types" : ["ordinal", "linear"]
            },
            "data": successData
        }
    ];

    var configSuccessWorld = {
        type: "map",
        x : "Country",
        legend : false,
        padding: { top:0, right:50, bottom:00, left:10 },
        renderer : "canvas",
        charts : [{type: "map",  y : "Logins", mapType : "world"}],
        width: 380,
        height: 250,
        colorScale:["#dcefdc","#5CB85C"]
    };

    configSuccessWorld.helperUrl = "../../portal/templates/geojson/countryInfo.json";
    configSuccessWorld.geoCodesUrl = "../../portal/templates/geojson/world.json";
    var worldSuccessChart = new vizg(worldSuccessData, configSuccessWorld);
    worldSuccessChart.draw("#mapSuccessDiv",[{type:"click", callback:mapCallBack}]);


    var worldFailedData =  [
        {
            "metadata" : {
                "names" : ["Country","Logins"],
                "types" : ["ordinal", "linear"]
            },
            "data": failedData
        }
    ];

    var configFailedWorld = {
        type: "map",
        x : "Country",
        legend : false,
        padding: { top:0, right:50, bottom:00, left:10 },
        renderer : "canvas",
        charts : [{type: "map",  y : "Logins", mapType : "world"}],
        width: 380,
        height: 250,
        colorScale:["#f6d6d5","#D9534F"]
    };

    configFailedWorld.helperUrl = "../../portal/templates/geojson/countryInfo.json";
    configFailedWorld.geoCodesUrl = "../../portal/templates/geojson/world.json";
    var worldFailedChart = new vizg(worldFailedData, configFailedWorld);
    worldFailedChart.draw("#mapFailDiv",[{type:"click", callback:mapCallBack}]);
}

document.body.onmouseup = function() {

    if((rangeStart) && (rangeEnd) && (rangeStart.toString() !== rangeEnd.toString())){

        if(event.target.nodeName == 'path' || event.target.nodeName == 'rect'){
            var timeFromValue = JSON.parse(JSON.stringify(listnedTimeFromValue));
            var timeToValue = JSON.parse(JSON.stringify(listnedTimeToValue));
            var timeRange = [timeFromValue, timeToValue];
            rangeHistoryArray.push(timeRange);
            $("#back").show();

            listnedTimeFromValue = new Date(rangeStart).getTime();
            listnedTimeToValue = new Date(rangeEnd).getTime();
            onDataChanged();
            var message = {
                timeFrom: listnedTimeFromValue,
                timeTo: listnedTimeToValue,
                timeUnit: "Custom"
            };
            gadgets.Hub.publish(TOPIC_SLIDER, message);
        }
    }
}
