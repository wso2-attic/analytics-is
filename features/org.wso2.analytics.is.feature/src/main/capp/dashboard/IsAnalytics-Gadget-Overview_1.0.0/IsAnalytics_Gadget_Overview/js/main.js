$(function(){
    var SHARED_PARAM = "?shared=true";
    $('#overall').click(function(){
        var targetUrl = OVERALL_LOGIN_ATTEMPTS_PAGE_URL;
        if(gadgetUtil.isSharedDashboard()){
            targetUrl += SHARED_PARAM;
        }
        parent.window.location = targetUrl;
    });

    $('#local').click(function(){
        var targetUrl = LOCAL_LOGIN_ATTEMPTS_PAGE_URL;
        if(gadgetUtil.isSharedDashboard()){
            targetUrl += SHARED_PARAM;
        }
        parent.window.location = targetUrl;
    });

    $('#federated').click(function(){
        var targetUrl = FEDERATED_LOGIN_ATTEMPTS_PAGE_URL;
        if(gadgetUtil.isSharedDashboard()){
            targetUrl += SHARED_PARAM;
        }
        parent.window.location = targetUrl;
    });
});