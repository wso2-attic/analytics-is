var TOPIC = "subscriber";
var PUBLISHER_TOPIC = "chart-zoomed";
var page = gadgetUtil.getCurrentPageName();
var qs = gadgetUtil.getQueryString();
var prefs = new gadgets.Prefs();
var type;
var chart = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE));
var rangeStart;
var rangeEnd;
var rangeHistoryArray = [];
var listnedTimeFromValue;
var listnedTimeToValue;
var gadgetContext = SESSION_CONTEXT;

if (chart) {
    type = gadgetUtil.getRequestType(page, chart);
}

$(function() {
    if (!chart) {
        $("#canvas").html(gadgetUtil.getErrorText("Gadget initialization failed. Gadget role must be provided."));
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

    var timeFrom = gadgetUtil.timeFrom();
    var timeTo = gadgetUtil.timeTo();
    gadgetUtil.fetchData(gadgetContext, {
        type: type,
        timeFrom: timeFrom,
        timeTo: timeTo,
        start: 0,
        count: 10        
    }, onData, onError);

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
            onTimeRangeChanged(message);
            gadgets.Hub.publish(PUBLISHER_TOPIC, message);
            if(rangeHistoryArray.length == 0) {
                $(this).hide();
            }
        }
    });
});

gadgets.HubSettings.onConnect = function() {
    gadgets.Hub.subscribe(TOPIC, function(topic, data, subscriberData) {
        onTimeRangeChanged(data);
        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        $("#back").hide();
    });
};

function onTimeRangeChanged(data) {

    gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
    gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());

    gadgetUtil.fetchData(gadgetContext, {
        type: type,
        timeFrom: data.timeFrom,
        timeTo: data.timeTo,
        start: 0,
        count: 10
    }, onData, onError);
};


function onData(response) {
    try {
        var data = response.message;
        if (data.length == 0) {
            $('#canvas').html(gadgetUtil.getEmptyRecordsText());
            return;
        }
        
        loadStats(data);
        
        //perform necessary transformation on input data
        chart.schema[0].data = chart.processData(data);
        //sort the timestamps
        chart.schema[0].data.sort(function(a, b) {
            return a[1] - b[1];
        });
        //finally draw the chart on the given canvas
        chart.chartConfig.width = $('body').width();
        chart.chartConfig.height = $('body').height();

        var vg = new vizg(chart.schema, chart.chartConfig);
        $("#canvas").empty();
        vg.draw("#canvas",[{type:"range", callback:onRangeSelected}]);

    } catch (e) {
        $('#canvas').html(gadgetUtil.getErrorText(e));
    }
};

function loadStats(data){
    var activeSessionCount = data[1].activeCount;
    $("#active-session-count").html(activeSessionCount);
}

function onError(msg) {
    $("#canvas").html(gadgetUtil.getErrorText(msg));
};

// $(window).resize(function() {
//     // if (page != TYPE_LANDING && qs[PARAM_ID]) {
//         drawChart();
//     // }
// });

document.body.onmouseup = function() {
    // var div = document.getElementById("dChart");
    // div.innerHTML = "<p> Start : " + rangeStart + "</p>" + "<p> End : " + rangeEnd + "</p>";

    if((rangeStart) && (rangeEnd) && (rangeStart.toString() !== rangeEnd.toString())){
        if((event.target.nodeName == 'svg' || event.target.nodeName == 'rect')&& !($(event.target).is('#back'))) {
            var timeFromValue = JSON.parse(JSON.stringify(listnedTimeFromValue));
            var timeToValue = JSON.parse(JSON.stringify(listnedTimeToValue));
            var timeRange = [timeFromValue, timeToValue];
            rangeHistoryArray.push(timeRange);
            $("#back").show();

            var message = {
                timeFrom: new Date(rangeStart).getTime(),
                timeTo: new Date(rangeEnd).getTime(),
                timeUnit: "Custom"
            };

            listnedTimeFromValue = new Date(rangeStart).getTime();
            listnedTimeToValue = new Date(rangeEnd).getTime();

            onTimeRangeChanged(message);
            gadgets.Hub.publish(PUBLISHER_TOPIC, message);
        }
    }
}

var onRangeSelected = function(start, end) {
    rangeStart = start;
    rangeEnd = end;
};