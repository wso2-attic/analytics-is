
var TOPIC_USER_PREFS = "subscriberUserPref";
var TOPIC_USER_PREFS_DELETION = "publisherUserPrefDeletion";
var TOPIC_FILTER_DELETION = "subscriberFilterDeletion";
var globalUniquArray = [];

$(document).ready(function () {

    var historyParms = gadgetUtil.getURLParams();

    for (var key in historyParms) {
        if (historyParms.hasOwnProperty(key)) {

            if(key != "persistTimeFrom" && key != "persistTimeTo" && key !="editor" && key !="shared"){

                var historyParamVal = historyParms[key].toString();
                addUserPrefsToGlobalArray(historyParamVal.split("_")[1],key,historyParamVal.split("_")[0]);
            }
        }
    }

    $('body').on('click', '[data-dismiss=tag]', function(){

        var userPref = $(this).closest('li').text();
        var topic;
        var category;
        var index;
        for(i=0;i<globalUniquArray.length;i++){
            if(globalUniquArray[i][1] == userPref){
                index = i;
                topic = globalUniquArray[i][0];
                category = globalUniquArray[i][2];
                break;
            }
        }

        globalUniquArray.splice(index, 1);

        var message = {
            topic: topic,
            userPref: userPref,
            category: category
        };

        $(this).closest('li').remove();

        gadgets.Hub.publish(TOPIC_USER_PREFS_DELETION, message);
    });
});

gadgets.HubSettings.onConnect = function() {

    gadgets.Hub.subscribe(TOPIC_USER_PREFS, function(topic, data, subscriberData) {
        addUserPrefsToGlobalArray(data.colorCode,data.mode,data.userPrefValue);
    });

    gadgets.Hub.subscribe(TOPIC_FILTER_DELETION, function(topic, data, subscriberData) {

        var isExist = false;
        var index = -1;

        var topic;
        var userPref;
        var category;

        if(globalUniquArray.length != 0){
            for(i=0;i<globalUniquArray.length;i++){
                if(globalUniquArray[i][2] == data.mode){
                    topic = globalUniquArray[i][0];
                    userPref = globalUniquArray[i][1];
                    category = globalUniquArray[i][2];
                    index = i;
                    isExist = true;
                    break;
                }
            }

            if(isExist) {
                globalUniquArray.splice(index, 1);

                $("#userPrefs ul").empty();

                for(i=0;i<globalUniquArray.length;i++){
                    $("#userPrefs ul").append('<li style="background-color:#438CAD">'+globalUniquArray[i][1]+'<i class="icon fw fw-cancel" data-dismiss="tag"></i></li>');
                }
            }

        }

        var message = {
            topic: topic,
            userPref: userPref,
            category: category
        };
        gadgets.Hub.publish(TOPIC_USER_PREFS_DELETION, message);

    });
};


function addUserPrefsToGlobalArray(colorCode,mode,userPrefValue){

    var isExist = false;
    var index = -1;
    var userPrefLabel;

    if(globalUniquArray.length != 0){
        for(i=0;i<globalUniquArray.length;i++){
            if(globalUniquArray[i][2] == mode){
                globalUniquArray[i][1] = userPrefValue;
                globalUniquArray[i][3] = colorCode;
                isExist = true;
                index = i;
                break;
            }
        }

        if(isExist){

            $("#userPrefs ul").empty();
            //$('#userPrefs').selectit('clear');

            for(i=0;i<globalUniquArray.length;i++){

                userPrefLabel = gadgetUtil.escapeHtml(globalUniquArray[i][1]);
                $("#userPrefs ul").append('<li style="background-color:#438CAD">'+userPrefLabel+'<i class="icon fw fw-cancel" data-dismiss="tag"></i></li>');
                //$('#userPrefs').selectit('add', globalUniquArray[i][1]);
            }
        }else{

            var arry = ["Topic",userPrefValue,mode,colorCode];
            globalUniquArray.push(arry);
            userPrefLabel = gadgetUtil.escapeHtml(userPrefValue);
            $("#userPrefs ul").append('<li style="background-color:#438CAD">'+userPrefLabel+'<i class="icon fw fw-cancel" data-dismiss="tag"></i></li>');
        }

    }else{
        var arry = ["Topic",userPrefValue,mode,colorCode]
        globalUniquArray.push(arry);
        userPrefLabel = gadgetUtil.escapeHtml(userPrefValue);
        $("#userPrefs ul").append('<li style="background-color:#438CAD">'+userPrefLabel+'<i class="icon fw fw-cancel" data-dismiss="tag"></i></li>');
    }

}