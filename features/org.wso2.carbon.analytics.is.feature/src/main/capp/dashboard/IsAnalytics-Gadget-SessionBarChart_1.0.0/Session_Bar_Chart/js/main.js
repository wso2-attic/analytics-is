var TOPIC_DATE_RANGE = "subscriber";
var listnedTimeFromValue;
var listnedTimeToValue;
var successGlobalPage = 1;
var gadgetContext = SESSION_CONTEXT;
var href = parent.window.location.href;
var hrefLastSegment = href.substr(href.lastIndexOf('/') + 1);
var resolveURI = parent.ues.global.dashboard.id == hrefLastSegment ? '../' : '../../';

var page = gadgetUtil.getCurrentPageName();
var prefs = new gadgets.Prefs();
var chart = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE));

if (chart) {
    functionType = gadgetUtil.getRequestType(page, chart);
}

$(function () {

    var historyParmExist = gadgetUtil.getURLParam("persistTimeFrom");

    if (historyParmExist == null) {
        listnedTimeFromValue = gadgetUtil.timeFrom();
        listnedTimeToValue = gadgetUtil.timeTo();
    } else {

        var historyParms = gadgetUtil.getURLParams();

        for (var key in historyParms) {
            if (historyParms.hasOwnProperty(key)) {

                if (key == "persistTimeFrom") {
                    listnedTimeFromValue = historyParms[key];
                } else if (key == "persistTimeTo") {
                    listnedTimeToValue = historyParms[key];
                }
            }
        }
    }

    onChange();
});

function successOnPaginationClicked(e, originalEvent, type, page) {
    successGlobalPage = page;

    gadgetUtil.fetchData(gadgetContext, {
        type: functionType,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        start: (page - 1) * 10,
        count: 10
    }, successOnData, successOnError);

}

gadgets.HubSettings.onConnect = function () {

    gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function (topic, data, subscriberData) {
        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        onChange();
    });
};

function onChange() {

    gadgetUtil.fetchData(gadgetContext, {
        type: functionType,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        start: 0,
        count: 10
    }, drawChartSuccess, successOnError);
};



function successOnError(msg) {
    $("#canvas").html(gadgetUtil.getErrorText(msg));
};

function drawChartSuccess(response) {
    var successDataObj = response.message;
    var allDataCount = successDataObj[1];
    var totalPages = parseInt(allDataCount / 10);

    if (allDataCount != 0) {

        if (allDataCount % 10 != 0) {
            totalPages += 1;
        }

        var options = {
            currentPage: successGlobalPage,
            totalPages: totalPages,
            onPageClicked: successOnPaginationClicked,
            alignment: 'right',
            shouldShowPage: function (type, page, current) {
                switch (type) {
                    case "first":
                    case "last":
                    case "page":
                        return false;
                    case "prev":

                        if(totalPages < 2){
                            return false;
                        }else{
                            return true;
                        }
                    case "next":
                        if (totalPages > 1) {
                            return true;
                        } else {
                            return false;
                        }
                }
            },
            itemTexts: function (type, page, current) {
                switch (type) {
                    case "prev":
                        return "<";
                    case "next":
                        return ">";
                }
            }
        };


        $('#idPaginate').bootstrapPaginator(options);

    }
    //perform necessary transformation on input data
    chart.schema[0].data = chart.processData(successDataObj[0]);
    //finally draw the chart on the given canvas
    chart.chartConfig.width = $("#canvas").width();
    chart.chartConfig.height = $("#canvas").height();
    if(chart.mode == "SESSION_COUNT_OVER_TIME" && successDataObj[0][0].sessionCount < 10) {
        chart.chartConfig.yTicks = successDataObj[0][0].sessionCount;
    }

    var vg = new vizg(chart.schema, chart.chartConfig);
    $("#canvas").empty();
    vg.draw("#canvas");
}

