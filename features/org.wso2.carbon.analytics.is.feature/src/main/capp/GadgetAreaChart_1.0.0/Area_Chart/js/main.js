var TOPIC_DATE_RANGE = "subscriber";
var TOPIC_USERNAME = "subscriberUser";
var TOPIC_USERPREF_DELETION = "subscriberUserPrefDeletion";
var TOPIC_SLIDER = "publisherSliderDateRange";
var listnedTimeFromValue;
var listnedTimeToValue;
var listnedAdditionalUserPrefs = "";
var globalUniqueArray = [];
var rangeStart;
var rangeEnd;

var page = gadgetUtil.getCurrentPageName();
var qs = gadgetUtil.getQueryString();
var prefs = new gadgets.Prefs();
var type;
var chart = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE));

if (chart) {
    type = gadgetUtil.getRequestType(page, chart);
}


$(function() {

    if (!chart) {
        $("#canvas").html(gadgetUtil.getErrorText("Gadget initialization failed. Gadget role must be provided."));
        return;
    }
    if (page != TYPE_LANDING && qs[PARAM_ID] == null) {
        $("#canvas").html(gadgetUtil.getDefaultText());
        return;
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
});

gadgets.HubSettings.onConnect = function() {

    gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function(topic, data, subscriberData) {

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
        listnedAdditionalUserPrefs: listnedAdditionalUserPrefs
    }, onData, onError);

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
        console.log(allData);

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
            "names": ["rpm", "torque", "horsepower", "EngineType"],
            "types": ["linear", "linear", "ordinal", "ordinal"]
        },
        "data": [
            [0, parseFloat(successPct), 12, "YES"],
            [0, parseFloat(failedPct), 12, "NO"]
        ]
    }];

    var dataF = [{
        "metadata": {
            "names": ["rpm", "torque", "horsepower", "EngineType"],
            "types": ["linear", "linear", "ordinal", "ordinal"]
        },
        "data": [
            [0, parseFloat(failedPct), 12, "YES"],
            [0, parseFloat(successPct), 12, "NO"]
        ]
    }];

    var configT = {
        charts: [{ type: "arc", x: "torque", color: "EngineType" }],
        innerRadius: 0.3,
        tooltip: { "enabled": false },
        padding: { top:0, right:0, bottom:0, left:0 },
        legend: false,
        percentage: true,
        colorScale: [successColor(), "#353B48"],
        width: 220,
        height: 220
    }

    var configF = {
        charts: [{ type: "arc", x: "torque", color: "EngineType" }],
        innerRadius: 0.3,
        tooltip: { "enabled": false },
        padding: { top:0, right:0, bottom:0, left:0 },
        legend: false,
        percentage: true,
        colorScale: [failColor(), "#353B48"],
        width: 220,
        height: 220
    }
    var chartT = new vizg(dataT, configT);
    chartT.draw("#dChartTrue");

    var chartF = new vizg(dataF, configF);
    chartF.draw("#dChartFalse");
}

document.body.onmouseup = function() {
    // var div = document.getElementById("dChart");
    // div.innerHTML = "<p> Start : " + rangeStart + "</p>" + "<p> End : " + rangeEnd + "</p>";

    if((rangeStart) && (rangeEnd) && (rangeStart.toString() !== rangeEnd.toString())){
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
