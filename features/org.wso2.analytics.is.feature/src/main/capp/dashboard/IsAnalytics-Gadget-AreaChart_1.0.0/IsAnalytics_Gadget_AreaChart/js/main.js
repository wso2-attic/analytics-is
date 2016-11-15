var TOPIC_DATE_RANGE = "subscriber";
var TOPIC_USERNAME = "subscriberUser";
var TOPIC_USERPREF_DELETION = "subscriberUserPrefDeletion";
var TOPIC_SLIDER = "publisherSliderDateRange";
var TOPIC_REGION = "publisherRegion";
var TOPIC_FIRST_LOGIN = "subscriberFirstLogin";
var listnedTimeFromValue;
var listnedTimeToValue;
var listnedAdditionalUserPrefs = "";
var listnedAdditionalUserPrefsForMap = "";
var globalUniqueArray = [];
var rangeStart;
var rangeEnd;
var rangeHistoryArray = [];
var idpTypeFilter = "";
var firstLoginFilter = "";
var isMapClicked = false;

var page = gadgetUtil.getCurrentPageName();
var qs = gadgetUtil.getQueryString();
var prefs = new gadgets.Prefs();
var type;
var chart = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE));
var map;
var publishTimeRange;

if (chart) {
    type = gadgetUtil.getRequestType(page, chart);
}


$(function() {

    if (!chart) {
        $("#canvas").html(gadgetUtil.getErrorText("Gadget initialization failed. Gadget role must be provided."));
        return;
    }
    if (page != TYPE_OVERALL && page != TYPE_LOCAL && page != TYPE_FEDERATED && qs[PARAM_ID] == null) {
        $("#canvas").html(gadgetUtil.getDefaultText());
        return;
    }


    if (page == TYPE_LOCAL) {
        idpTypeFilter = "LOCAL";
    } else if (page == TYPE_FEDERATED) {
        idpTypeFilter = "FEDERATED";
    } else if (page == TYPE_OVERALL) {
        idpTypeFilter = "";
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

    onDataChanged(true);

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
            onDataChanged(true);

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
        onDataChanged(true);
        $("#back").hide();
    });

    gadgets.Hub.subscribe(TOPIC_USERNAME, function(topic, data, subscriberData) {

        addUserPrefsToGlobalArray(topic,data.mode,data.userPrefValue);
        onDataChanged(true);
    });

    gadgets.Hub.subscribe(TOPIC_FIRST_LOGIN, function (topic, data, subscriberData) {
        var firstLogin = data.firstLogin;
        if(firstLogin == "enable") {
            firstLoginFilter = " AND NOT authFirstSuccessCount:0";
        } else {
            firstLoginFilter = "";
        }
        onDataChanged(true);
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
        listnedAdditionalUserPrefsForMap ="";

        for(i=0;i<globalUniqueArray.length;i++){
            if(globalUniqueArray[i][2] == "USERNAME"){
                listnedAdditionalUserPrefs += " AND username:\""+globalUniqueArray[i][1]+"\"";
                listnedAdditionalUserPrefsForMap += " AND username:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
                listnedAdditionalUserPrefs += " AND serviceProvider:\""+globalUniqueArray[i][1]+"\"";
                listnedAdditionalUserPrefsForMap += " AND serviceProvider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "ROLE"){
                listnedAdditionalUserPrefs += " AND rolesCommaSeparated:\""+globalUniqueArray[i][1]+"\"";
                listnedAdditionalUserPrefsForMap += " AND rolesCommaSeparated:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
                listnedAdditionalUserPrefs += " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
                listnedAdditionalUserPrefsForMap += " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "USERSTORE"){
                listnedAdditionalUserPrefs+= " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
                listnedAdditionalUserPrefsForMap += " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "REGION"){
                listnedAdditionalUserPrefs += " AND region:\""+globalUniqueArray[i][1]+"\"";
            }else if (globalUniqueArray[i][2] == "FIRST_TIME_SERVICEPROVIDER") {
                listnedAdditionalUserPrefs += " AND serviceProvider:\"" + globalUniqueArray[i][1] + "\"";
                listnedAdditionalUserPrefs += " AND NOT authFirstSuccessCount:0";
            }
        }

        onDataChanged(true);
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
    listnedAdditionalUserPrefsForMap = "";

    for(i=0;i<globalUniqueArray.length;i++){
        if(globalUniqueArray[i][2] == "USERNAME"){
            listnedAdditionalUserPrefs += " AND username:\""+globalUniqueArray[i][1]+"\"";
            listnedAdditionalUserPrefsForMap += " AND username:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
            listnedAdditionalUserPrefs += " AND serviceProvider:\""+globalUniqueArray[i][1]+"\"";
            listnedAdditionalUserPrefsForMap += " AND serviceProvider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "ROLE"){
            listnedAdditionalUserPrefs += " AND rolesCommaSeparated:\""+globalUniqueArray[i][1]+"\"";
            listnedAdditionalUserPrefsForMap += " AND rolesCommaSeparated:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
            listnedAdditionalUserPrefs += " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
            listnedAdditionalUserPrefsForMap += " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "USERSTORE"){
            listnedAdditionalUserPrefs+= " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
            listnedAdditionalUserPrefsForMap += " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
        }else if(globalUniqueArray[i][2] == "REGION"){
            listnedAdditionalUserPrefs += " AND region:\""+globalUniqueArray[i][1]+"\"";
        }else if (globalUniqueArray[i][2] == "FIRST_TIME_SERVICEPROVIDER") {
            listnedAdditionalUserPrefs += " AND serviceProvider:\"" + globalUniqueArray[i][1] + "\"";
            listnedAdditionalUserPrefs += " AND NOT authFirstSuccessCount:0";
        }
    }
}



function onDataChanged(refreshMap) {

    gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
    gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());

    gadgetUtil.fetchData(AUTHENTICATION_CONTEXT, {
        type: type,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs: listnedAdditionalUserPrefs,
        idpType:idpTypeFilter,
        firstLogin:firstLoginFilter
    }, onData, onError);

    if(refreshMap == true && isMapClicked == false) {
        gadgetUtil.fetchData(AUTHENTICATION_CONTEXT, {
            type: 25,
            timeFrom: listnedTimeFromValue,
            timeTo: listnedTimeToValue,
            listnedAdditionalUserPrefs: listnedAdditionalUserPrefsForMap,
            idpType:idpTypeFilter,
            firstLogin:firstLoginFilter,
            start:0,
            count:10
        }, loadMap, onError);
    }

    isMapClicked = false;

};


function onData(response) {
    try {
        if(!response.message) {
            parent.window.location = parent.window.location.href;
        }
	var timeUnit = response.timeUnit;
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

        var allData = processData(data,timeUnit);
        var message = {
            success: allData[1],
            failed: allData[2]
        };

        var maxSuccessCount = allData[3];
        var maxFailureCount = allData[4];

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
        if((maxSuccessCount + maxFailureCount) < 10) {
            chart.chartConfig.yTicks = maxSuccessCount + maxFailureCount;
        }

        if(allData[0] != "" && allData[0].length < 6) {
            chart.chartConfig.xTicks = allData[0].length;
        }

        var vg = new vizg(chart.schema, chart.chartConfig);
        $("#canvas").empty();
        vg.draw("#canvas",[{type:"range", callback:callbackmethod}]);
    } catch (e) {
        $('#canvas').html(gadgetUtil.getErrorText(e));
    }
}


function processData(data,timeUnit) {


console.log('data '+JSON.stringify(timeUnit)+JSON.stringify(data));

        var result = [];
        var tableData = [];
        var overallAuthSuccessCount = 0;
        var overallAuthFailureCount = 0;
        var maxSuccessCount = 0;
        var maxFailureCount = 0;
        var timeUnit;
        var previousTimestamp;

        if(data.length > 0) {
            timeUnit = data[0].timeUnit;
            previousTimestamp = data[0].timestamp;
        }

        var step;
        if(timeUnit == "MINUTE") {
            step = 60000;
        } else if(timeUnit == "HOUR") {
            step = 3600000;
        } else if(timeUnit == "DAY") {
            step = 86400000;
        } else if(timeUnit == "MONTH") {
            step = 2628000000;
        } else if(timeUnit == "YEAR") {
            step = 31540000000;
        }


        data.forEach(function(row, i) {
            var timestamp = row['timestamp'];
            var successCount = row["successCount"];
            var faultCount = row["faultsCount"];
            overallAuthSuccessCount += successCount;
            overallAuthFailureCount += faultCount;
            maxSuccessCount = Math.max(maxSuccessCount, successCount);
            maxFailureCount = Math.max(maxFailureCount, faultCount);


            if((row['timestamp'] - previousTimestamp) > step) { 
              if(timeUnit != "MONTH"){
                for(var t=(previousTimestamp - previousTimestamp%step + step); t<row.timestamp; t=t+step) {
                    tableData.push([0, t, "Success"]);
                    tableData.push([0, t, "Failures"]);
                }
                }else {
                  var timestampBetween = (row['timestamp'] - previousTimestamp);
                  var dateRaw = new Date (row['timestamp']*1 ); 
                  var datePrevious = new Date (previousTimestamp*1);

                   var x = datePrevious.getMonth();
                   if(datePrevious.getMonth() == 11){  
                   x = -1;
                   }

                  for(var t= x+1; t<dateRaw.getMonth(); t++) {  

                       var firstDateOfTheMonth = new Date(dateRaw.getFullYear(),t,'1','0','0','0','0');
                       var timeStampBetween = firstDateOfTheMonth.getTime();
                       tableData.push([0, timeStampBetween, "Success"]);   
                       tableData.push([0, timeStampBetween, "Failures"]);
                    }
                }
            }

            previousTimestamp = row.timestamp;

            tableData.push([successCount, timestamp, "Success"]);
            tableData.push([-faultCount,timestamp , "Failures"]);
        });
        result.push(tableData);
        result.push(overallAuthSuccessCount);
        result.push(overallAuthFailureCount);
        result.push(maxSuccessCount);
        result.push(maxFailureCount);

        return result;
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
    $("#successCount").html(success);
    $("#successPercent").html("Success: " + (total > 0 ? parseFloat(successPct).toFixed(2) + "%" : ""));
    $("#failedPercent").html("Failure: " + (total > 0 ? parseFloat(failedPct).toFixed(2) + "%" : ""));

    var successColor = function(){
        return parseFloat(successPct) > 0 ? '#5CB85C' : '#353B48';
    };

    var failColor = function(){
        return parseFloat(failedPct) > 0 ? '#D9534F' : '#353B48';
    };

//draw donuts
    var dataT = [{
                     "metadata": {
                         "names": ["Rate", "Status", "Percentage"],
                         "types": ["linear", "ordinal", "ordinal"]
                     },
                     "data": [
                         [parseFloat(success), "Success", (success/total*100).toFixed(2) + "%"],
                         [parseFloat(failed), "Failures", (failed/total*100).toFixed(2) + "%"]
                     ]
                 }];

    var configT = {
        charts: [{ type: "arc", x: "Rate", color: "Status", mode:"donut" }],
        tooltip: {"enabled":true, "color":"#e5f2ff", "type":"symbol", "content":["Status","Rate","Percentage"], "label":false},

        innerRadius: 0.3,
        padding: { top:0, right:0, bottom:0, left:0 },
        legend: false,
        percentage: false,
        colorScale: [successColor(), failColor()],
        width: ($( window ).width()/12 * 2),
        height: 140
    }

    var chartT = new vizg(dataT, configT);
    chartT.draw("#donutDiv");
}

function loadMap(data) {

    if(data.message.length == 0) {
        $("#chkMap").attr("disabled", true);
    } else {
        $("#chkMap").attr("disabled", false);
    }

    var successData = [];
    var failedData = [];


    var mapCallBack = function(event, item) {

        if (item != null) {
            var region = item.datum.zipped.unitName;
            map.mode = "REGION";

            if (region) {
                var message = {
                    userPrefValue: region,
                    mode: map.mode,
                    colorCode:map.colorCode
                };

                gadgetUtil.updateURLParam(map.mode, region + "_" +map.colorCode);
                isMapClicked = true;
                gadgets.Hub.publish(TOPIC_REGION, message);
            }
        }
    }


    for (var i = 0 ; i < data.message.length; i++) {
        if (data.message[i].authSuccessCount) {
            successData.push([data.message[i].region, data.message[i].authSuccessCount]);
        }
        if (data.message[i].authFailureCount) {
            failedData.push([data.message[i].region, data.message[i].authFailureCount]);
        }
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
        highlight : "single",
        legend : false,
        padding: { top:20, right:50, bottom:20, left:10 },
        renderer : "canvas",
        charts : [{type: "map",  y : "Logins", mapType : "world"}],
        width: 340,
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
        highlight : "single",
        legend : false,
        padding: { top:0, right:50, bottom:00, left:10 },
        renderer : "canvas",
        charts : [{type: "map",  y : "Logins", mapType : "world"}],
        width: 340,
        height: 250,
        colorScale:["#f6d6d5","#D9534F"]
    };

    configFailedWorld.helperUrl = "../../portal/templates/geojson/countryInfo.json";
    configFailedWorld.geoCodesUrl = "../../portal/templates/geojson/world.json";
    var worldFailedChart = new vizg(worldFailedData, configFailedWorld);
    worldFailedChart.draw("#mapFailDiv",[{type:"click", callback:mapCallBack}]);
}

document.body.onmouseup = function(event) {

    if((rangeStart) && (rangeEnd) && (rangeStart.toString() !== rangeEnd.toString())){

        if(event.target.nodeName == 'path' || event.target.nodeName == 'rect'){
            var timeFromValue = JSON.parse(JSON.stringify(listnedTimeFromValue));
            var timeToValue = JSON.parse(JSON.stringify(listnedTimeToValue));
            var timeRange = [timeFromValue, timeToValue];
            rangeHistoryArray.push(timeRange);
            $("#back").show();

            listnedTimeFromValue = new Date(rangeStart).getTime();
            listnedTimeToValue = new Date(rangeEnd).getTime();
            onDataChanged(true);
            var message = {
                timeFrom: listnedTimeFromValue,
                timeTo: listnedTimeToValue,
                timeUnit: "Custom"
            };
            gadgets.Hub.publish(TOPIC_SLIDER, message);
        }
    }
}
