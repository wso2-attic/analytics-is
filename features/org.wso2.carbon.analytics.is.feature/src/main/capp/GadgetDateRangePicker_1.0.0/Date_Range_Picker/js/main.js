var href = parent.window.location.href,
    hrefLastSegment = href.substr(href.lastIndexOf('/') + 1),
    resolveURI = parent.ues.global.dashboard.id == hrefLastSegment ? '../' : '../../',
    parentWindow = window.parent.document,
    gadgetWrapper = $('#' + gadgets.rpc.RPC_ID, parentWindow).closest('.grid-stack-item');

var TOPIC = "publisher";
var TOPIC_DATE_RANGE = "subscriber";

$(function() {
    var dateLabel = $('#reportrange'),
        datePickerBtn = $('#btnCustomRange');
    //if there are url elemements present, use them. Otherwis use last hour

    var timeFrom = moment().subtract(29, 'days');
    var timeTo = moment();
    var message = {};

    var qs = gadgetUtil.getQueryString();
    if (qs.timeFrom != null) {
        timeFrom = parseInt(qs.timeFrom);
    }
    if (qs.timeTo != null) {
        timeTo = parseInt(qs.timeTo);
    }
    var count = 0;

    //make the selected time range highlighted
    var timeUnit = qs.timeUnit;

    if (timeUnit != null) {
        $("#date-select [role=date-update][data-value=" + timeUnit + "]").addClass("active");
    } else {
        $("#date-select [role=date-update][data-value=LastMonth]").addClass("active");
    }

    cb(moment(timeFrom), moment(timeTo));

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
            $(datePickerBtn).addClass("active");
        }
    }
    
    $(datePickerBtn).on('apply.daterangepicker', function(ev, picker) {
        cb(picker.startDate, picker.endDate);
    });
    
    $(datePickerBtn).on('show.daterangepicker', function(ev, picker) {
        $(this).attr('aria-expanded', 'true');
    });
    
    $(datePickerBtn).on('hide.daterangepicker', function(ev, picker) {
        $(this).attr('aria-expanded', 'false');
    });

    $(datePickerBtn).daterangepicker({
        "timePicker": true,
        "autoApply": true,
        "alwaysShowCalendars": true,
        "opens": "left"
    });
    
    $("#date-select [role=date-update]").click(function(){
        
        $("#date-select button").removeClass("active");
        $("#date-select [data-value=" + $(this).data('value') + "]").addClass("active");
        $('#btnDropdown > span:first-child').html($(this).html());
        $('#btnDropdown').addClass('active');
        
        switch($(this).data('value')){
            case 'LastHour':
                dateLabel.html(moment().subtract(1, 'hours').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
                message = {
                    timeFrom: new Date(moment().subtract(1, 'hours')).getTime(),
                    timeTo: new Date(moment()).getTime(),
                    timeUnit: "Hour"
                };
                break;
            case 'LastDay':
                dateLabel.html(moment().subtract(1, 'day').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
                message = {
                    timeFrom: new Date(moment().subtract(1, 'day')).getTime(),
                    timeTo: new Date(moment()).getTime(),
                    timeUnit: "Day"
                };
                break;
            case 'LastMonth':
                dateLabel.html(moment().subtract(29, 'days').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
                message = {
                    timeFrom: new Date(moment().subtract(29, 'days')).getTime(),
                    timeTo: new Date(moment()).getTime(),
                    timeUnit: "Month"
                };
                break;
            case 'LastYear':
                dateLabel.html(moment().subtract(1, 'year').format('MMMM D, YYYY hh:mm A') + ' - ' + moment().format('MMMM D, YYYY hh:mm A'));
                message = {
                    timeFrom: new Date(moment().subtract(1, 'year')).getTime(),
                    timeTo: new Date(moment()).getTime(),
                    timeUnit: "Year"
                };
                break;
            default:
                return;
        }
        
        gadgets.Hub.publish(TOPIC, message);
        
        $(gadgetWrapper).removeClass('btn-dropdown-menu-open');
        $('#btnDropdown').attr('aria-expanded', 'false');
    });
    
    $('#btnDropdown').click(function() {
        if($(gadgetWrapper).hasClass('btn-dropdown-menu-open')){
            $(gadgetWrapper).removeClass('btn-dropdown-menu-open');
            $(this).attr('aria-expanded', 'false');
        }
        else{
            $(gadgetWrapper).addClass('btn-dropdown-menu-open');
            $(this).attr('aria-expanded', 'true');
        }
    });

});

gadgets.HubSettings.onConnect = function() {
  gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function (topic, data, subscriberData) {
        var listnedTimeFromValue = parseInt(gadgetUtil.getURLParam("persistTimeFrom"));
        var listnedTimeToValue = parseInt(gadgetUtil.getURLParam("persistTimeTo"));
        $("#date-select button").removeClass("active");
        $('#btnCustomRange').addClass("active");
        var dateLabel = $('#reportrange .btn-label');
        dateLabel.html(moment(listnedTimeFromValue).format('MMMM D, YYYY hh:mm A') + ' - ' + moment(listnedTimeToValue).format('MMMM D, YYYY hh:mm A'));
    });
};

function onChartZoomed(data) {
    console.log(data); 
    message = {
        timeFrom: data.timeFrom,
        timeTo: data.timeTo,
        timeUnit: "Custom"
    };
    gadgets.Hub.publish(TOPIC, message);
    var start = data.timeFrom;
    var end = data.timeTo;
    // dateLabel.html(start.format('MMMM D, YYYY hh:mm A') + ' - ' + end.format('MMMM D, YYYY hh:mm A'));
    if (data.timeUnit && (data.timeUnit == 'Custom')) {
        $("#date-select button").removeClass("active");
        $(datePickerBtn).addClass("active");
    }
};

$(window).resize(function() {
    if(($('body').attr('media-screen') == 'md') || ($('body').attr('media-screen') == 'lg')){
        $(gadgetWrapper).removeClass('btn-dropdown-menu-open');
        $('#btnDropdown').attr('aria-expanded', 'false');
    }
});

$(window).load(function() {
    var datePicker = $('.daterangepicker'),
        dropdown = $('ul.dropdown-menu');
    
    $('body').click(function(e){
        if ((!dropdown.is(e.target) && dropdown.has(e.target).length === 0)
            && (!$('#btnDropdown').is(e.target) && $('#btnDropdown').has(e.target).length === 0)) {
                $(gadgetWrapper).removeClass('btn-dropdown-menu-open');
                $('#btnDropdown').attr('aria-expanded', 'false');
        }
    });

    $('head', parentWindow).append('<link rel="stylesheet" type="text/css" href="' + resolveURI + 'store/carbon.super/gadget/Date_Range_Picker/css/daterangepicker.css" />');
    $('body', parentWindow).append('<script src="' + resolveURI + 'store/carbon.super/gadget/Date_Range_Picker/js/daterangepicker.js" type="text/javascript"></script>');
    $(gadgetWrapper).append(datePicker);
    $(gadgetWrapper).append(dropdown);
    $(gadgetWrapper).closest('.ues-component-box').addClass('widget form-control-widget');
    $('body').addClass('widget');
});