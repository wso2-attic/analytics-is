/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This Javascript module groups utility methods that are being used by all the gadgets in the ESB analytics dashboard
 */

var AUTHENTICATION_CONTEXT = "/portal/apis/isanalytics";
var SESSION_CONTEXT = "/portal/apis/issessionanalytics";
var DASHBOARD_NAME = "IsAnalytics-AuthenticationData";
var BASE_URL = getDashboardBaseUrl();

var TYPE_OVERALL = "overall";
var TYPE_LOCAL = "local";
var TYPE_FEDERATED = "federated";
var TYPE_SESSIONS = "sessions";
var TYPE_PROXY = "proxy";
var TYPE_API = "api";
var TYPE_SEQUENCE = "sequence";
var TYPE_ENDPOINT = "endpoint";
var TYPE_INBOUND_ENDPOINT = "inbound";
var TYPE_MEDIATOR = "mediator";
var TYPE_MESSAGE = "message";

var ROLE_OVERALL_AUTHENTICATION_COUNT = "overallAuthCount";
var ROLE_PER_USER_AUTHENTICATION_SUCCESS_COUNT = "userAuthenticationSuccessCount";
var ROLE_PER_USER_AUTHENTICATION_FAILURE_COUNT = "userAuthenticationFailureCount";
var ROLE_PER_SERVICE_PROVIDER_AUTHENTICATION_SUCCESS_COUNT = "serviceProviderAuthenticationSuccessCount";
var ROLE_PER_SERVICE_PROVIDER_AUTHENTICATION_FAILURE_COUNT = "serviceProviderAuthenticationFailureCount";
var ROLE_PER_ROLE_AUTHENTICATION_SUCCESS_COUNT = "roleAuthenticationSuccessCount";
var ROLE_PER_ROLE_AUTHENTICATION_FAILURE_COUNT = "roleAuthenticationFailureCount";
var ROLE_PER_IDENTITY_PROVIDER_AUTHENTICATION_SUCCESS_COUNT = "identityProviderAuthenticationSuccessCount";
var ROLE_PER_IDENTITY_PROVIDER_AUTHENTICATION_FAILURE_COUNT = "identityProviderAuthenticationFailureCount";
var ROLE_PER_SERVICE_PROVIDER_FIRST_LOGIN_COUNT = "serviceProviderAuthenticationFirstLoginSuccessCount";
var ROLE_PER_USERSTORE_AUTHENTICATION_SUCCESS_COUNT = "userstoreAuthenticationSuccessCount";
var ROLE_PER_USERSTORE_AUTHENTICATION_FAILURE_COUNT = "userstoreAuthenticationFailureCount";
var ROLE_TOP_LONGEST_SESSIONS = "topLongestSessions";
var ROLE_PER_USER_AVERAGE_SESSION_DURATION = "userSessionDuration";
var ROLE_SESSION_COUNT_OVER_TIME = "sessionCount";
var ROLE_SESSION_CHANGE_OVER_TIME = "sessionChangeCount";
var ROLE_LATENCY = "latency";
var ROLE_RATE = "rate";

var PARAM_ID = "id";
var PARAM_TYPE = "type";
var PARAM_GADGET_ROLE = "role";

var OVERALL_LOGIN_ATTEMPTS_PAGE_URL = BASE_URL + TYPE_OVERALL;
var LOCAL_LOGIN_ATTEMPTS_PAGE_URL = BASE_URL + TYPE_LOCAL;
var FEDERATED_LOGIN_ATTEMPTS_PAGE_URL = BASE_URL + TYPE_FEDERATED;
var SESSIONS_PAGE_URL = BASE_URL + TYPE_SESSIONS;

var PARENT_WINDOW = window.parent.document;

function getDashboardBaseUrl() {
    var currentUrl = window.parent.location.href;
    var BaseUrlRegex = new RegExp(".*?(portal.*dashboards)");
    var tenantBaseUrl = BaseUrlRegex.exec(currentUrl)[1];
    return "/" + tenantBaseUrl + "/"  + DASHBOARD_NAME + "/";
}

function GadgetUtil() {
    var DEFAULT_START_TIME = new Date(moment().subtract(1, 'hours')).getTime();
    var DEFAULT_END_TIME = new Date(moment()).getTime();

    this.isSharedDashboard = function () {
        if (this.getQueryString().shared &&
            (['true', 'false'].indexOf(this.getQueryString().shared) > -1)) {
            return $.parseJSON(this.getQueryString().shared);
        }
    };

    this.getQueryString = function() {
        var queryStringKeyValue = window.parent.location.search.replace('?', '').split('&');
        var qsJsonObject = {};
        if (queryStringKeyValue != '') {
            for (i = 0; i < queryStringKeyValue.length; i++) {
                qsJsonObject[queryStringKeyValue[i].split('=')[0]] = queryStringKeyValue[i].split('=')[1];
            }
        }
        return qsJsonObject;
    };

    this.getChart = function(chartType) {
        var chart = null;
        charts.forEach(function(item, i) {
            if (item.name === chartType) {
                chart = item;
            }
        });
        return chart;
    };

    this.getCurrentPageName = function() {
        var pageName,type;
        var href = parent.window.location.href;
        var dashboardNameEndIndex = href.indexOf(DASHBOARD_NAME) + DASHBOARD_NAME.length;
        var substrAfterDashboardName = href.substr(dashboardNameEndIndex + 1);        // additional +1 for /
        if(substrAfterDashboardName.indexOf('?') == 0 || substrAfterDashboardName == null || substrAfterDashboardName.trim() == "") {
            pageName = TYPE_OVERALL;
        } else {
            var indexOfSeparator = substrAfterDashboardName.indexOf('?');
            if(indexOfSeparator == -1) {
                pageName = substrAfterDashboardName;
            } else {
                pageName = substrAfterDashboardName.substr(0, indexOfSeparator);
            }
        }
        return pageName;
    };

    this.getRequestType = function(pageName,chart) {
        chart.types.forEach(function(item, i) {
            if (item.name === pageName) {
                type = item.type;
            }
        });
        return type;
    };

    this.getFilterType = function(pageName,chart) {
        var filter;
        chart.types.forEach(function(item, i) {
            if (item.name === pageName) {
                filter = item.filter;
            }
        });
        return filter;
    };

    this.getGadgetConfig = function(typeName) {
        var config = null;
        configs.forEach(function(item, i) {
            if (item.name === typeName) {
                config = item;
            }
        });
        return config;
    };

    this.getCurrentPage = function() {
        var pageName;
        var href = parent.window.location.href;
        var dashboardNameEndIndex = href.indexOf(DASHBOARD_NAME) + DASHBOARD_NAME.length;
        var substrAfterDashboardName = href.substr(dashboardNameEndIndex + 1);        // additional +1 for /
        if(substrAfterDashboardName.indexOf('?') == 0 || substrAfterDashboardName == null || substrAfterDashboardName.trim() == "") {
            pageName = TYPE_OVERALL;
        } else {
            var indexOfSeparator = substrAfterDashboardName.indexOf('?');
            if(indexOfSeparator == -1) {
                pageName = substrAfterDashboardName;
            } else {
                pageName = substrAfterDashboardName.substr(0, indexOfSeparator);
            }
        }
        return this.getGadgetConfig(pageName);
    };

    this.timeFrom = function() {
        var timeFrom = DEFAULT_START_TIME;
        var qs = this.getQueryString();
        if (qs.timeFrom != null) {
            timeFrom = qs.timeFrom;
        }
        return timeFrom;
    };

    this.timeTo = function() {
        var timeTo = DEFAULT_END_TIME;
        var qs = this.getQueryString();
        if (qs.timeTo != null) {
            timeTo = qs.timeTo;
        }
        return timeTo;
    };

    this.fetchData = function(context, params, callback, error) {
        var url = "?";
        for (var param in params) {
            url = url + param + "=" + params[param] + "&";
        }
        $.ajax({
            url: context + url,
            type: "GET",
            success: function(data) {
                callback(data);
            },
            error: function(msg) {
                error(msg);
            }
        });
    };

    this.fetchDataSync = function(context, params, callback, error) {
        var url = "?";
        for (var param in params) {
            url = url + param + "=" + params[param] + "&";
        }
        $.ajax({
            url: context + url,
            type: "GET",
            success: function(data) {
                callback(data);
            },
            error: function(msg) {
                error(msg);
            },
            async: false
        });
    };

    this.getDefaultText = function() {
        return '<div class="status-message">'+
            '<div class="message message-info">'+
            '<h4><i class="icon fw fw-info"></i>No content to display</h4>'+
            '<p>Please select a date range to view stats.</p>'+
            '</div>'+
            '</div>';
    };

    this.getEmptyRecordsText = function() {
        return '<div class="status-message">'+
            '<div class="message message-info">'+
            '<h4><i class="icon fw fw-info"></i>No records found</h4>'+
            '<p>Please select a date range to view stats.</p>'+
            '</div>'+
            '</div>';
    };

    this.getErrorText = function(msg) {
        return '<div class="status-message">'+
            '<div class="message message-danger">'+
            '<h4><i class="icon fw fw-info"></i>Error</h4>'+
            '<p>An error occured while attempting to display this gadget. Error message is: ' + msg.status + ' - ' + msg.statusText + '</p>'+
            '</div>'+
            '</div>';
    };

    this.getCookie = function(cname) {
        var name = cname + "=";
        var ca = parent.document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    };

    this.getGadgetWrapper = function(){
        return $('#' + gadgets.rpc.RPC_ID, PARENT_WINDOW).closest('.gadget-body');
    };

    this.getGadgetParentWrapper = function(){
        return $('#' + gadgets.rpc.RPC_ID, PARENT_WINDOW).closest('.ues-component-box');
    };

    this.getView = function(){
        if( $('#' + gadgets.rpc.RPC_ID, PARENT_WINDOW).closest('.ues-component-box').hasClass('ues-component-fullview') ){
            return 'maximized';
        }
        else{
            return 'minimized';
        }
    };

    this.updateURLParam = function(key, value) {
        if (typeof (history.pushState) === "undefined") {
            console.warn("Browser doesn't support updating the url.");
            return;
        }

        var searchPath = window.parent.location.search,
            replace = new RegExp("(&|\\?)" + key + "=(.*?)(&|$)", "g"),
            urlParams = this.getURLParams(),
            values = [],
            unfiltered = "?filtered=false";

        if (Object.prototype.toString.call( value ) === '[object Array]') {
            values = value;
        } else if (Object.prototype.toString.call( value ) === "[object String]"){
            values.push(value);
        } else {
            console.error("value should be either an array of strings or a string");
            return;
        }

        if (searchPath.replace(unfiltered, "")) {
            if (key in urlParams) {
                if (values.length > 0) {
                    searchPath = searchPath.replace(replace, "$1" + key + "=" + values.toString() + "$3");
                } else {
                    if (searchPath.replace(replace, "")) {
                        searchPath = searchPath.replace(replace, "$1").replace(/&$/, '');
                    } else {
                        searchPath = unfiltered;
                    }
                }
            } else if (values.length > 0) {
                searchPath += "&" + key + "=" + values.toString();
            }
        } else if (values.length > 0) {
            searchPath = searchPath.replace(unfiltered, "");
            searchPath += "?" + key + "=" + values.toString();
        }
        window.parent.history.pushState({}, "", searchPath);
    }

    this.removeURLParam = function(key) {
        this.updateURLParam(key, []);
    }

    this.getURLParam = function(key) {
        var params = this.getURLParams();
        if (key in params) {
            return params[key];
        } else {
            return null;
        }
    }

    this.getURLParams = function() {
        var match,
            pl = /\+/g,
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.parent.location.search.substring(1),
            urlParams = {};
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]).split(',');
        delete urlParams["filtered"];
        return urlParams;
    }

    this.escapeHtml = function(stringToSanitize) {
        return stringToSanitize
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

}

var gadgetUtil = new GadgetUtil();

function mediaScreenSize(){
    var windowWidth = $(window).width();
    if(windowWidth < 767){
        $('body').attr('media-screen', 'xs');
    }
    if((windowWidth > 768) && (windowWidth < 991)){
        $('body').attr('media-screen', 'sm');
    }
    if((windowWidth > 992) && (windowWidth < 1199)){
        $('body').attr('media-screen', 'md');
    }
    if(windowWidth > 1200){
        $('body').attr('media-screen', 'lg');
    }
}

// Light/Dark Theme Switcher
$(document).ready(function() {

    $(gadgetUtil.getGadgetWrapper()).addClass('loading');

    if((gadgetUtil.getCookie('dashboardTheme') == 'dark') || gadgetUtil.getCookie('dashboardTheme') == ''){
        $('body').addClass('dark');
    }
    else{
        $('body').removeClass('dark');
    }

    if(typeof $.fn.nanoScroller == 'function'){
        $(".nano").nanoScroller();
    }

    mediaScreenSize();

});

$(window).resize(function(){
    mediaScreenSize();
});