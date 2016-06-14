var TOPIC_DATE_RANGE = "subscriber";
var TOPIC_PUB_USERPREF = "publisherUser";
var TOPIC_SUB_USERPREF = "subscriberUserPref";
var TOPIC_USERPREF_DELETION = "subscriberUserPrefDeletion";
var listnedTimeFromValue;
var listnedTimeToValue;
var listnedAdditionalUserPrefs = "";
var globalUniqueArray = [];
var successGlobalPage = 1;
var failureGlobalPage = 1;
var suggestionsList = [];
var maxSuccessRcordValue;
var maxFailureRcordValue;
var successDataObj;
var failureDataObj;
var commonScaleDomain;
var idpTypeFilter = "";

var qs = gadgetUtil.getQueryString();
var page = gadgetUtil.getCurrentPageName();
var prefs = new gadgets.Prefs();
var chartSuccess = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE)+"SuccessCount");
var chartFailure = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE)+"FailureCount");

if (chartSuccess && chartFailure) {
    functionTypeSuccess = gadgetUtil.getRequestType(page, chartSuccess);
    functionTypeFailure = gadgetUtil.getRequestType(page, chartFailure);
    filterType = gadgetUtil.getFilterType(page, chartSuccess);
} else if (chartSuccess) {
    functionTypeSuccess = gadgetUtil.getRequestType(page, chartSuccess);
    filterType = gadgetUtil.getFilterType(page, chartSuccess);
}


$(function() {

    $('#autocomplete-search-box .typeahead').typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            local: suggestionsList,
            source: substringMatcher(suggestionsList)
        });

    $("#remove-filter").off().click(function (event) {
        var $input = $("#autocomplete-search-box .typeahead");
        $input.val('');
        $(this).hide();
        $('#add-filter').show();
        $('#autocomplete-search-box .typeahead').prop('disabled', false);
        var message = {
            userPrefValue: $('#autocomplete-search-box .typeahead.tt-input').val(),
            mode: chartFailure.mode,
            colorCode:chartFailure.colorCode
        };
        gadgets.Hub.publish("publisherFilterDeletion", message);
    });

    $("#add-filter").off().click(function (event) {
        $('#remove-filter').show();
        $(this).hide();
        $('#autocomplete-search-box .typeahead').prop('disabled', true);
        var message = {
            userPrefValue: $('#autocomplete-search-box .typeahead.tt-input').val(),
            mode: chartSuccess.mode,
            colorCode:chartSuccess.colorCode
        };
        gadgets.Hub.publish(TOPIC_PUB_USERPREF, message);

    });


    if (!chartSuccess && chartFailure) {
        $("#canvasSuccess").html(gadgetUtil.getErrorText("Gadget initialization failed. Gadget role must be provided."));
        $("#canvasFailure").html(gadgetUtil.getErrorText("Gadget initialization failed. Gadget role must be provided."));
        return;
    }

    $( ".residentIdp").empty();

    if(page == TYPE_RESIDENT_IDP) {
        idpTypeFilter = " AND isFederated:\"false\"";
    } else {
        idpTypeFilter = " AND isFederated:\"true\"";

        var instanceType = chartSuccess.mode;
        if(instanceType == "IDENTITYPROVIDER"){
            $( ".residentIdp").append( "<a class='idResident' onclick='onResidentIdpClick();'>Resident Identity Provider</a>" );
        }
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
                    var instanceType = chartSuccess.mode;

                    if(key != instanceType){
                        var alreadySelected = false;
                        for(i=0;i<globalUniqueArray.length;i++){
                            if(globalUniqueArray[i][2] == instanceType){
                                alreadySelected = true;
                                break;
                            }
                        }
                        if(!alreadySelected){
                            if(key == "USERNAME"){
                                listnedAdditionalUserPrefs+= " AND userName:\""+historyParamVal.split("_")[0]+"\"";
                            }else if(key == "SERVICEPROVIDER"){
                                listnedAdditionalUserPrefs+= " AND serviceprovider:\""+historyParamVal.split("_")[0]+"\"";
                            }else if(key == "ROLE"){
                                listnedAdditionalUserPrefs+= " AND rolesCommaSeperated:\""+historyParamVal.split("_")[0]+"\"";
                            }else if(key == "IDENTITYPROVIDER"){
                                listnedAdditionalUserPrefs+= " AND identityProvider:\""+historyParamVal.split("_")[0]+"\"";
                            }else if(key == "USERSTORE"){
                                listnedAdditionalUserPrefs+= " AND userStoreDomain:\""+historyParamVal.split("_")[0]+"\"";
                            }else if(key == "FIRST_TIME_SERVICEPROVIDER"){
                                listnedAdditionalUserPrefs+= " AND serviceprovider:\""+historyParamVal.split("_")[0]+"\"";
                            }
                        }
                    }
                }
            }
        }
    }

    onChange();
});


function onResidentIdpClick() {
    var targetUrl = RESIDENT_IDP_PAGE_URL;
    parent.window.location = targetUrl;
};

function successOnPaginationClicked(e,originalEvent,type,page){
    successGlobalPage = page;

    gadgetUtil.fetchData(CONTEXT, {
        type: functionTypeSuccess,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs:listnedAdditionalUserPrefs,
        idpType:idpTypeFilter,
        start:(page - 1) * 10,
        count:10
    }, successOnData, successOnError);

}

function failureOnPaginationClicked(e,originalEvent,type,page){
    failureGlobalPage = page;

    gadgetUtil.fetchData(CONTEXT, {
        type: functionTypeFailure,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs:listnedAdditionalUserPrefs,
        idpType:idpTypeFilter,
        start:(page - 1) * 10,
        count:10
    }, failureOnData, failureOnError);

}

gadgets.HubSettings.onConnect = function() {

    gadgets.Hub.subscribe(TOPIC_DATE_RANGE, function(topic, data, subscriberData) {
        listnedTimeFromValue = data.timeFrom;
        listnedTimeToValue = data.timeTo;
        onChange();
    });

    gadgets.Hub.subscribe(TOPIC_SUB_USERPREF, function(topic, data, subscriberData) {

        var instanceType = chartSuccess.mode;

        addUserPrefsToGlobalArray(topic,data.mode,data.userPrefValue);

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
            }else if(globalUniqueArray[i][2] == "USERSTORE"){
                listnedAdditionalUserPrefs+= " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "FIRST_TIME_SERVICEPROVIDER"){
                listnedAdditionalUserPrefs+= " AND serviceprovider:\""+globalUniqueArray[i][1]+"\"";
            }
        }

        if(instanceType != data.mode){

            if(instanceType == "SERVICEPROVIDER" || instanceType == "FIRST_TIME_SERVICEPROVIDER"){

                if(instanceType == "SERVICEPROVIDER" && data.mode != "FIRST_TIME_SERVICEPROVIDER"){
                    var alreadySelected = false;
                    for(i=0;i<globalUniqueArray.length;i++){
                        if(globalUniqueArray[i][2] == instanceType){
                            alreadySelected = true;
                            break;
                        }
                    }
                    if(!alreadySelected){
                        onChange();
                    }
                }else if(instanceType == "FIRST_TIME_SERVICEPROVIDER" && data.mode != "SERVICEPROVIDER"){
                    var alreadySelected = false;
                    for(i=0;i<globalUniqueArray.length;i++){
                        if(globalUniqueArray[i][2] == instanceType){
                            alreadySelected = true;
                            break;
                        }
                    }
                    if(!alreadySelected){
                        onChange();
                    }

                }
            }else{
                var alreadySelected = false;
                for(i=0;i<globalUniqueArray.length;i++){
                    if(globalUniqueArray[i][2] == instanceType){
                        alreadySelected = true;
                        break;
                    }
                }
                if(!alreadySelected){
                    onChange();
                }
            }
        }
    });

    gadgets.Hub.subscribe(TOPIC_USERPREF_DELETION, function(topic, data, subscriberData) {


        var index = -1;
        for(i=0;i<globalUniqueArray.length;i++){
            if(globalUniqueArray[i][2] == data.category){
                index = i;
                break;
            }
        }
        if(index != -1){
            globalUniqueArray.splice(index, 1);
        }

        gadgetUtil.removeURLParam(data.category);

        listnedAdditionalUserPrefs = "";

        for(i=0;i<globalUniqueArray.length;i++){
            if(globalUniqueArray[i][2] == "USERNAME"){
                listnedAdditionalUserPrefs+= " AND userName:\""+globalUniqueArray[i][1]+"\"";
            }if(globalUniqueArray[i][2] == "SERVICEPROVIDER"){
                listnedAdditionalUserPrefs+= " AND serviceprovider:\""+globalUniqueArray[i][1]+"\"";
            }if(globalUniqueArray[i][2] == "ROLE"){
                listnedAdditionalUserPrefs+= " AND rolesCommaSeperated:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "IDENTITYPROVIDER"){
                listnedAdditionalUserPrefs+= " AND identityProvider:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "USERSTORE"){
                listnedAdditionalUserPrefs+= " AND userStoreDomain:\""+globalUniqueArray[i][1]+"\"";
            }else if(globalUniqueArray[i][2] == "FIRST_TIME_SERVICEPROVIDER"){
                listnedAdditionalUserPrefs+= " AND serviceprovider:\""+globalUniqueArray[i][1]+"\"";
            }
        }

        var instanceType = chartSuccess.mode;

        if(instanceType != data.category){

            var alreadySelected = false;
            for(i=0;i<globalUniqueArray.length;i++){
                if(globalUniqueArray[i][2] == instanceType){
                    alreadySelected = true;
                    break;
                }
            }
            if(!alreadySelected){
                onChange();
            }
        }else {
            $('#add-filter').show();
            $('#autocomplete-search-box .typeahead').prop('disabled', false);
            $('#remove-filter').hide();
            var $input = $("#autocomplete-search-box .typeahead");
            $input.val('');
            onChange();
        }
    });
};

function addUserPrefsToGlobalArray(topic,mode,value){

    var valExist = false;

    if(globalUniqueArray.length != 0){
        for(i=0;i<globalUniqueArray.length;i++){
            if(globalUniqueArray[i][2] == mode){
                valExist = true;
                globalUniqueArray[i][0] = topic;
                globalUniqueArray[i][1] = value;
                break;
            }
        }

        if(!valExist){
            var arry = [topic,value,mode];
            globalUniqueArray.push(arry);
        }
    }else{
        var arry = [topic,value,mode];
        globalUniqueArray.push(arry);
    }


}

function onChange() {

    gadgetUtil.fetchData(CONTEXT, {
        type: functionTypeSuccess,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs:listnedAdditionalUserPrefs,
        idpType:idpTypeFilter,
        start:0,
        count:10
    }, successOnData, successOnError);

    gadgetUtil.fetchData(CONTEXT, {
        type: filterType,
        timeFrom: listnedTimeFromValue,
        timeTo: listnedTimeToValue,
        listnedAdditionalUserPrefs:listnedAdditionalUserPrefs,
        idpType:idpTypeFilter,
        start:0,
        count:10
    }, processSuggestionsList, successOnError);
};


function successOnData(response) {
    try {
        successDataObj = response.message;

        if(successDataObj[0].length > 0){
            maxSuccessRcordValue = successDataObj[0][0].authSuccessCount;
        }else{
            maxSuccessRcordValue = 0;
        }
        if (chartFailure) {
            $('#canvasSuccess').css({"height":"35%"});
            $('#canvasFailure').css({"height":"35%"});
            gadgetUtil.fetchData(CONTEXT, {
                type: functionTypeFailure,
                timeFrom: listnedTimeFromValue,
                timeTo: listnedTimeToValue,
                listnedAdditionalUserPrefs: listnedAdditionalUserPrefs,
                idpType:idpTypeFilter,
                start: 0,
                count: 10
            }, failureOnData, failureOnError);
        } else {
            $(".failureChart").remove();
            $('#canvasSuccess').css({"height":"80%"});
            $('.bkWrapColor').css({"background-color":"#d6d6c2"});
            drawChartSuccess();

        }

    } catch (e) {
        //$('#canvas').html(gadgetUtil.getErrorText(e));
    }
};

function successOnError(msg) {
    $("#canvasSuccess").html(gadgetUtil.getErrorText(msg));
};


function failureOnData(response) {
    try {
        failureDataObj = response.message;

        if(failureDataObj[0].length > 0){
            maxFailureRcordValue = failureDataObj[0][0].authFailiureCount;
        }else{
            maxFailureRcordValue = 0;
        }

        if(maxSuccessRcordValue > maxFailureRcordValue){
            commonScaleDomain = maxSuccessRcordValue;
        }else{
            commonScaleDomain = maxFailureRcordValue;
        }

        chartSuccess.chartConfig.yScaleDomain = [0,commonScaleDomain];
        chartFailure.chartConfig.yScaleDomain = [0,commonScaleDomain];

        drawChartSuccess();
        drawChartFailure();

    } catch (e) {
        //$('#canvas').html(gadgetUtil.getErrorText(e));
    }
};

function failureOnError(msg) {
    $("#canvasFailure").html(gadgetUtil.getErrorText(msg));
};


function drawChartSuccess(){

    var allDataCount = successDataObj[1];
    var totalPages = parseInt(allDataCount / 10);

    if(allDataCount != 0) {

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
                        if (current > 1) {
                            return true;
                        } else {
                            return false;
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
                        return "Prev";
                    case "next":
                        return "Next";
                }
            }
        };


        $('#idSuccessPaginate').bootstrapPaginator(options);

    }

    //perform necessary transformation on input data
    chartSuccess.schema[0].data = chartSuccess.processData(successDataObj[0]);
    //finally draw the chart on the given canvas
    chartSuccess.chartConfig.width = $("#canvasSuccess").width();
    chartSuccess.chartConfig.height = $("#canvasSuccess").height();

    var vg = new vizg(chartSuccess.schema, chartSuccess.chartConfig);
    $("#canvasSuccess").empty();

    if (chartFailure) {
        vg.draw("#canvasSuccess",[{type:"click", callback:typeSuccessCallbackmethod}]);
    }else{
        vg.draw("#canvasSuccess");
    }



}


function drawChartFailure(){

    var allDataCount = failureDataObj[1];

    var totalPages = parseInt(allDataCount / 10);

    if(allDataCount != 0){

        if(allDataCount % 10 != 0){
            totalPages += 1;
        }

        var options = {
            currentPage: failureGlobalPage,
            totalPages: totalPages,
            onPageClicked: failureOnPaginationClicked,
            alignment:'right',
            shouldShowPage:function(type, page, current){
                switch(type)
                {
                    case "first":
                    case "last":
                    case "page":
                        return false;
                    case "prev":
                        if(current > 1){
                            return true;
                        }else{
                            return false;
                        }
                    case "next":
                        if(totalPages > 1){
                            return true;
                        }else{
                            return false;
                        }
                }
            },
            itemTexts: function (type, page, current) {
                switch (type) {
                    case "prev":
                        return "Prev";
                    case "next":
                        return "Next";
                }
            }
        };

        $('#idFailurePaginate').bootstrapPaginator(options);
    }



    //perform necessary transformation on input data
    chartFailure.schema[0].data = chartFailure.processData(failureDataObj[0]);
    //finally draw the chart on the given canvas
    chartFailure.chartConfig.width = $("#canvasFailure").width() - 10;
    chartFailure.chartConfig.height = $("#canvasFailure").height();

    var vg = new vizg(chartFailure.schema, chartFailure.chartConfig);
    $("#canvasFailure").empty();
    vg.draw("#canvasFailure",[{type:"click", callback:typeFailureCallbackmethod}]);
}

var typeSuccessCallbackmethod = function(event, item) {

    var userPrefKey = chartSuccess.chartConfig.x;
    var jsonObj = item.datum;
    var userPrefValue = "";

    for (var key in jsonObj) {
        if(key == userPrefKey){
            userPrefValue = jsonObj[key];
        }
    }

    if(userPrefValue != ""){

        var valExist = false;

        if(globalUniqueArray.length != 0){
            for(i=0;i<globalUniqueArray.length;i++){
                if(globalUniqueArray[i][2] == chartSuccess.mode){
                    valExist = true;
                    globalUniqueArray[i][0] = TOPIC_PUB_USERPREF;
                    globalUniqueArray[i][1] = userPrefValue;
                    break;
                }
            }

            if(!valExist){
                var arry = [TOPIC_PUB_USERPREF,userPrefValue,chartSuccess.mode];
                globalUniqueArray.push(arry);
            }
        }else{
            var arry = [TOPIC_PUB_USERPREF,userPrefValue,chartSuccess.mode];
            globalUniqueArray.push(arry);
        }

        var message = {
            userPrefValue: userPrefValue,
            mode: chartSuccess.mode,
            colorCode:chartSuccess.colorCode
        };

        gadgetUtil.updateURLParam(chartSuccess.mode, userPrefValue + "_" +chartSuccess.colorCode);

        gadgets.Hub.publish(TOPIC_PUB_USERPREF, message);

        $("#autocomplete-search-box .typeahead").typeahead('val', userPrefValue);
        $('#autocomplete-search-box .typeahead').prop('disabled', true);
        $('#add-filter').hide();
        $('#remove-filter').show();
    }
};


var typeFailureCallbackmethod = function(event, item) {

    var userPrefKey = chartFailure.chartConfig.x;
    var jsonObj = item.datum;
    var userPrefValue;

    for (var key in jsonObj) {
        if(key == userPrefKey){
            userPrefValue = jsonObj[key];
        }
    }

    if(userPrefValue != ""){

        var valExist = false;

        if(globalUniqueArray.length != 0){
            for(i=0;i<globalUniqueArray.length;i++){
                if(globalUniqueArray[i][2] == chartFailure.mode){
                    valExist = true;
                    globalUniqueArray[i][0] = TOPIC_PUB_USERPREF;
                    globalUniqueArray[i][1] = userPrefValue;
                    break;
                }
            }

            if(!valExist){
                var arry = [TOPIC_PUB_USERPREF,userPrefValue,chartFailure.mode];
                globalUniqueArray.push(arry);
            }
        }else{
            var arry = [TOPIC_PUB_USERPREF,userPrefValue,chartFailure.mode];
            globalUniqueArray.push(arry);
        }

        var message = {
            userPrefValue: userPrefValue,
            mode: chartFailure.mode,
            colorCode:chartFailure.colorCode
        };

        gadgetUtil.updateURLParam(chartFailure.mode, userPrefValue + "_" +chartFailure.colorCode);

        gadgets.Hub.publish(TOPIC_PUB_USERPREF, message);

        $("#autocomplete-search-box .typeahead").typeahead('val', userPrefValue);
        $('#autocomplete-search-box .typeahead').prop('disabled', true);
        $('#add-filter').hide();
        $('#remove-filter').show();
    }
};

var escape = function(text) {
    return text.replace(/[-[/\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

var substringMatcher = function() {

    return function findMatches(q, cb) {

        switch (filterType) {
            case 12: {
                listnedAdditionalUserPrefs= " AND userName:"+ escape(q) +"*";
                break;
            }
            case 13: {
                listnedAdditionalUserPrefs= " AND serviceprovider:"+ escape(q) +"*";
                break;
            }
            case 14: {
                listnedAdditionalUserPrefs= " AND identityProvider:"+ escape(q) +"*";
                break;
            }
            case 15: {
                listnedAdditionalUserPrefs= " AND role:"+ escape(q) +"*";
                break;
            }
            case 16: {
                listnedAdditionalUserPrefs= " AND userStoreDomain:"+ escape(q) +"*";
                break;
            }
            default : {
                listnedAdditionalUserPrefs = "";
            }
        }

        gadgetUtil.fetchDataSync(CONTEXT, {
            type: filterType,
            timeFrom: listnedTimeFromValue,
            timeTo: listnedTimeToValue,
            listnedAdditionalUserPrefs:listnedAdditionalUserPrefs,
            idpType:idpTypeFilter,
            start:0,
            count:10
        }, function(response) {
            try {
                var data = response.message;
                suggestionsList = [];

                for (var i=0; i < data.length; i++) {
                    for (var key in data[i]) {
                        suggestionsList.push(data[i][key]);
                    }
                }
                cb(suggestionsList);
            } catch (e) {
                //$('#canvas').html(gadgetUtil.getErrorText(e));
            }
        }, successOnError);
    };
};
