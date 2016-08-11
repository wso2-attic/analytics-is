$(function(){
    $('#overall').click(function(){
        var targetUrl = OVERALL_LOGIN_ATTEMPTS_PAGE_URL;
        parent.window.location = targetUrl;
    });

    $('#local').click(function(){
        var targetUrl = LOCAL_LOGIN_ATTEMPTS_PAGE_URL;
        parent.window.location = targetUrl;
    });

    $('#federated').click(function(){
        var targetUrl = FEDERATED_LOGIN_ATTEMPTS_PAGE_URL;
        parent.window.location = targetUrl;
    });
});