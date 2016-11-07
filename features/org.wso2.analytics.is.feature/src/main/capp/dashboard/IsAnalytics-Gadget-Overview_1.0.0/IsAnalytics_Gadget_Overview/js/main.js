var TOPIC_DATE_RANGE = "subscriber";
var listnedTimeFromValue;
var listnedTimeToValue;
var seeMoreButtonDateValue;
var timeUnit="";

$(function(){
    var SHARED_PARAM = "?shared=true";
    $('#overall').click(function(){
        var targetUrl = OVERALL_LOGIN_ATTEMPTS_PAGE_URL;
        if(gadgetUtil.isSharedDashboard()){
            targetUrl += SHARED_PARAM;
        }

        if(seeMoreButtonDateValue){
        parent.window.location = targetUrl+ seeMoreButtonDateValue+timeUnit;
        } else{
        parent.window.location = targetUrl+timeUnit;
        }
    });

    $('#local').click(function(){
        var targetUrl = LOCAL_LOGIN_ATTEMPTS_PAGE_URL;
        if(gadgetUtil.isSharedDashboard()){
            targetUrl += SHARED_PARAM;
        }

        if(seeMoreButtonDateValue){
        parent.window.location = targetUrl+ seeMoreButtonDateValue+timeUnit;
        } else{
        parent.window.location = targetUrl+timeUnit;
        }
    });

    $('#federated').click(function(){
        var targetUrl = FEDERATED_LOGIN_ATTEMPTS_PAGE_URL;
        if(gadgetUtil.isSharedDashboard()){
            targetUrl += SHARED_PARAM;
        }

        if(seeMoreButtonDateValue){
        parent.window.location = targetUrl+ seeMoreButtonDateValue+timeUnit;
        } else{
        parent.window.location = targetUrl+timeUnit;
        }
    });

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
                }
            }
        }
    }
    onDataChanged();
});

function onDataChanged() {

    gadgetUtil.updateURLParam("persistTimeFrom", listnedTimeFromValue.toString());
    gadgetUtil.updateURLParam("persistTimeTo", listnedTimeToValue.toString());

    gadgetUtil.fetchData(AUTHENTICATION_CONTEXT, {
        type: 1,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs: "",
        idpType:"",
        firstLogin:""
    }, loadOverallStats, onError);

    gadgetUtil.fetchData(AUTHENTICATION_CONTEXT, {
        type: 1,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs: "",
        idpType:"LOCAL",
        firstLogin:""
    }, loadLocalStats, onError);

    gadgetUtil.fetchData(AUTHENTICATION_CONTEXT, {
        type: 1,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs: "",
        idpType:"FEDERATED",
        firstLogin:""
    }, loadFederatedStats, onError);
};

function loadOverallStats(response) {
    loadStats(response, "Overall");
}

function loadLocalStats(response) {
    loadStats(response, "Local");
}

function loadFederatedStats(response) {
    loadStats(response, "Federated");
}

function loadStats(response, type){
    if(!response.message) {
        parent.window.location = parent.window.location.href;
        return;
    }

    var message = response.message;

    var allData = processData(message);

    var success = allData[0];
    var failed = allData[1];
    var total = success + failed;

    var failedPct = (failed / total) * 100;
    var successPct = 100 - failedPct;

    $("#totalCount" + type).html(total);
    $("#successPercent" + type).html((total > 0 ? "Success: " + parseFloat(successPct).toFixed(2) + "%" : ""));
    $("#failedPercent" + type).html((total > 0 ? "Failure: " + parseFloat(failedPct).toFixed(2) + "%" : ""));

    if(total == 0) {
        $("#donutDiv" + type).empty();
    } else {
        var successColor = function () {
            return parseFloat(successPct) > 0 ? '#5CB85C' : '#353B48';
        };

        var failColor = function () {
            return parseFloat(failedPct) > 0 ? '#D9534F' : '#353B48';
        };

        var dataT = [{
            "metadata": {
                "names": ["Rate", "Status"],
                "types": ["linear", "ordinal"]
            },
            "data": [
                [parseFloat(success), "Success"],
                [parseFloat(failed), "Failures"]
            ]
        }];

        var configT = {
            charts: [{type: "arc", x: "Rate", color: "Status", mode: "donut"}],
            tooltip: {"enabled": false},
            innerRadius: 0.3,
            padding: {top: 10, right: 10, bottom: 20, left: 10},
            legend: false,
            percentage: false,
            colorScale: [successColor(), failColor()],
            width: ($(window).width() / 12 * 2),
            height: 170
        }

        var chartT = new vizg(dataT, configT);
        chartT.draw("#donutDiv" + type);
    }
}

function onError(msg) {
    $("#donutDiv").html(gadgetUtil.getErrorText(msg));
};

function processData(data) {
    var result = [];
    var overallAuthSuccessCount = 0;
    var overallAuthFailureCount = 0;

    data.forEach(function(row, i) {
        var successCount = row["successCount"];
        var faultCount = row["faultsCount"];
        overallAuthSuccessCount += successCount;
        overallAuthFailureCount += faultCount;
    });
    result.push(overallAuthSuccessCount);
    result.push(overallAuthFailureCount);
    return result;
}

gadgets.HubSettings.onConnect = function() {
    gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function(topic, data, subscriberData) {

        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        timeUnit = "&timeUnit="+data.timeUnit;
        seeMoreButtonDateValue = "?persistTimeFrom="+ listnedTimeFromValue + "&persistTimeTo=" + listnedTimeToValue;
        onDataChanged();
    });
};