var href = parent.window.location.href,
    hrefLastSegment = href.substr(href.lastIndexOf('/') + 1),
    resolveURI = parent.ues.global.dashboard.id == hrefLastSegment ? '../' : '../../';

var TOPIC = "publisher";

$(function() {
    var dateLabel = $('#reportrange .btn-label');
    //if there are url elemements present, use them. Otherwis use last hour
    var timeFrom = moment().subtract(1, 'hours');
    var timeTo = moment();
    var message = {};

    var qs = gadgetUtil.getQueryString();
    if (qs.timeFrom != null) {
        timeFrom = qs.timeFrom;
    }
    if (qs.timeTo != null) {
        timeTo = qs.timeTo;
    }
    var count = 0;

    //make the selected time range highlighted
    var timeUnit = qs.timeUnit;

    if (timeUnit != null) {
        $("#btnLast" + timeUnit).addClass("active");
    } else {
        $("#btnLastHour").addClass("active");
    }

    cb(moment().subtract(1, 'hours'), moment());

    function cb(start, end) {
        dateLabel.html(start.format('MMMM D, YYYY hh:mm A') + ' - ' + end.format('MMMM D, YYYY hh:mm A'));
        if (count != 0) {
            message = {
                timeFrom: new Date(start).getTime(),
                timeTo: new Date(end).getTime(),
                timeUnit: "Custom"
            };
            gadgets.Hub.publish(TOPIC, message);
        }
        count++;
        if (message.timeUnit && (message.timeUnit == 'Custom')) {
            $("#date-select button").removeClass("active");
            $("#reportrange #btnCustomRange").addClass("active");
        }
    }

    $('#btnCustomRange').daterangepicker({
        "timePicker": true,
        "autoApply": true,
        "alwaysShowCalendars": true,
        "opens": "left"
    }, cb);

    $("#btnLastHour").click(function() {
        dateLabel.html(moment().subtract(1, 'hours').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
        $("#date-select button").removeClass("active");
        $(this).addClass("active");
        message = {
            timeFrom: new Date(moment().subtract(1, 'hours')).getTime(),
            timeTo: new Date(moment()).getTime(),
            timeUnit: "Hour"
        };
        gadgets.Hub.publish(TOPIC, message);
    });

    $("#btnLastDay").click(function() {
        dateLabel.html(moment().subtract(1, 'day').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
        $("#date-select button").removeClass("active");
        $(this).addClass("active");
        message = {
            timeFrom: new Date(moment().subtract(1, 'day')).getTime(),
            timeTo: new Date(moment()).getTime(),
            timeUnit: "Day"
        };
        gadgets.Hub.publish(TOPIC, message);
    });

    $("#btnLastMonth").click(function() {
        dateLabel.html(moment().subtract(29, 'days').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
        $("#date-select button").removeClass("active");
        $(this).addClass("active");
        message = {
            timeFrom: new Date(moment().subtract(29, 'days')).getTime(),
            timeTo: new Date(moment()).getTime(),
            timeUnit: "Month"
        };
        gadgets.Hub.publish(TOPIC, message);
    });

    $("#btnLastYear").click(function() {
        dateLabel.html(moment().subtract(1, 'year').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
        $("#date-select button").removeClass("active");
        $(this).addClass("active");
        message = {
            timeFrom: new Date(moment().subtract(1, 'year')).getTime(),
            timeTo: new Date(moment()).getTime(),
            timeUnit: "Year"
        };
        gadgets.Hub.publish(TOPIC, message);
    });

});

$(window).load(function() {
    var datePicker = $('.daterangepicker'),
        parentWindow = window.parent.document,
        thisParentWrapper = $('#' + gadgets.rpc.RPC_ID, parentWindow).closest('.gadget-body');

    $('head', parentWindow).append('<link rel="stylesheet" type="text/css" href="' + resolveURI + 'store/carbon.super/gadget/Date_Range_Picker/css/daterangepicker.css" />');
    $('body', parentWindow).append('<script src="' + resolveURI + 'store/carbon.super/gadget/Date_Range_Picker/js/daterangepicker.js" type="text/javascript"></script>');
    $(thisParentWrapper).append(datePicker);
    $(thisParentWrapper).closest('.ues-component-box').addClass('widget form-control-widget');
    $('body').addClass('widget');
});