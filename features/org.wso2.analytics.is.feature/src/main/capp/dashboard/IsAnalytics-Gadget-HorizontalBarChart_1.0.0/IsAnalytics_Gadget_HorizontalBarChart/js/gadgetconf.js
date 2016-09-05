var chartPadding = {"top":10,"left":100,"bottom":40,"right":20};

var charts = [{
    name: ROLE_PER_USER_AUTHENTICATION_SUCCESS_COUNT,
    columns: ["authSuccessCount", "username", "xLabel"],
    schema: [{
        "metadata": {
            "names": ["authSuccessCount", "username", "xLabel"],
            "types": ["linear","ordinal","ordinal"]
        },
        "data": []
    }],
    "chartConfig":
    {
        "x":"xLabel",
        "yTitle":"Successful Attempts",
        "xTitle":"Username",
        "maxLength":"3000",
        "barGap":0.2,
        "highlight" : "single",
        "colorScale":["#5CB85C"],
        "selectionColor":"#5BF85C",
        "padding":chartPadding,
        "tooltip":{"enabled":true, "content":["username", "authSuccessCount"] },
        "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
    types: [
        { name: TYPE_OVERALL, type: 2, filter:12 },
        { name: TYPE_LOCAL, type: 2, filter:12 },
        { name: TYPE_FEDERATED, type: 2, filter:12 }
    ],
    mode: "USERNAME",
    colorCode: "SUCCESS",
    isSelected: false,
    processData: function(data) {
        var result = [];
        data.forEach(function(row, i) {
            var authSuccessCount = row['authSuccessCount'];
            var username = row["username"];
            var xLabel;
            if(row['username'].length > 12) {
                xLabel = row['username'].substr(0, 10) + "..";
            } else {
                xLabel =row['username'];
            }
            result.push([authSuccessCount, username, xLabel]);
        });
        return result;
    }
}, {
    name: ROLE_PER_USER_AUTHENTICATION_FAILURE_COUNT,
    columns: ["authFailureCount", "username", "xLabel"],
    schema: [{
        "metadata": {
            "names": ["authFailureCount", "username", "xLabel"],
            "types": ["linear","ordinal", "ordinal"]
        },
        "data": []
    }],
    "chartConfig":
    {
        "x":"xLabel",
        "maxLength":"3000",
        "xTitle":"Username",
        "yTitle":"Failure Attempts",
        "highlight" : "single",
        "barGap":0.2,
        "padding":chartPadding,
        "tooltip":{"enabled":true, "content":["username", "authFailureCount"] },
        "colorScale":["#D9534F"],
        "selectionColor":"#FF2112",
        "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
    types: [
        { name: TYPE_OVERALL, type: 3, filter:12 },
        { name: TYPE_LOCAL, type: 3, filter:12 },
        { name: TYPE_FEDERATED, type: 3, filter:12 }
    ],
    mode: "USERNAME",
    colorCode: "FAILURE",
    isSelected: false,
    processData: function(data) {
        var result = [];
        data.forEach(function(row, i) {
            var authFailureCount = row['authFailiureCount'];
            var username = row["username"];
            var xLabel;
            if(row['username'].length > 12) {
                xLabel = row['username'].substr(0, 10) + "..";
            } else {
                xLabel =row['username'];
            }
            result.push([authFailureCount, username, xLabel]);
        });
        return result;
    }
},{
    name: ROLE_PER_SERVICE_PROVIDER_AUTHENTICATION_SUCCESS_COUNT,
    columns: ["authSuccessCount", "serviceProvider", "xLabel"],
    schema: [{
        "metadata": {
            "names": ["authSuccessCount", "serviceProvider", "xLabel"],
            "types": ["linear","ordinal", "ordinal"]
        },
        "data": []
    }],
    "chartConfig":
    {
        "x":"xLabel",
        "yTitle":"Successful Attempts",
        "xTitle":"Service Provider",
        "maxLength":"3000",
        "highlight" : "single",
        "barGap":0.2,
        "colorScale":["#5CB85C"],
        "selectionColor":"#5BF85C",
        "padding":chartPadding,
        "tooltip":{"enabled":true, "content":["serviceProvider", "authSuccessCount"] },
        "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
    types: [
        { name: TYPE_OVERALL, type: 4, filter:13 },
        { name: TYPE_LOCAL, type: 4, filter:13 },
        { name: TYPE_FEDERATED, type: 4, filter:13}
    ],
    mode: "SERVICEPROVIDER",
    colorCode: "SUCCESS",
    isSelected: false,
    processData: function(data) {
        var result = [];
        data.forEach(function(row, i) {
            var authSuccessCount = row['authSuccessCount'];
            var serviceProvider = row["serviceProvider"];
            var xLabel;
            if(row['serviceProvider'].length > 12) {
                xLabel = row['serviceProvider'].substr(0, 10) + "..";
            } else {
                xLabel =row['serviceProvider'];
            }
            result.push([authSuccessCount, serviceProvider, xLabel]);
        });
        return result;
    }
},
    {
        name: ROLE_PER_ROLE_AUTHENTICATION_SUCCESS_COUNT,
        columns: ["authSuccessCount", "role", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "role", "xLabel"],
                "types": ["linear","ordinal","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "xTitle":"Role",
            "yTitle":"Successful Attempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["role", "authSuccessCount"] },
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_OVERALL, type: 6, filter:15 },
            { name: TYPE_LOCAL, type: 6, filter:15 }
        ],
        mode: "ROLE",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var role = row["role"];
                var xLabel;
                if(row['role'].length > 12) {
                    xLabel = row['role'].substr(0, 10) + "..";
                } else {
                    xLabel =row['role'];
                }
                result.push([authSuccessCount, role, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_SERVICE_PROVIDER_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "serviceProvider", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "serviceProvider", "xLabel"],
                "types": ["linear","ordinal","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "yTitle":"Failure Attempts",
            "xTitle":"Service Provider",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["serviceProvider", "authFailureCount"] },
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_OVERALL, type: 5, filter:13 },
            { name: TYPE_LOCAL, type: 5, filter:13 },
            { name: TYPE_FEDERATED, type: 5, filter:13 }
        ],
        mode: "SERVICEPROVIDER",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var serviceProvider = row["serviceProvider"];
                var xLabel;
                if(row['serviceProvider'].length > 12) {
                    xLabel = row['serviceProvider'].substr(0, 10) + "..";
                } else {
                    xLabel =row['serviceProvider'];
                }
                result.push([authFailureCount, serviceProvider, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_ROLE_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "role", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "role", "xLabel"],
                "types": ["linear","ordinal","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "xTitle":"Role",
            "yTitle":"Failure Attempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["role", "authFailureCount"] },
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_OVERALL, type: 7, filter:15 },
            { name: TYPE_LOCAL, type: 7, filter:15 }
        ],
        mode: "ROLE",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var role = row["role"];
                var xLabel;
                if(row['role'].length > 12) {
                    xLabel = row['role'].substr(0, 10) + "..";
                } else {
                    xLabel =row['role'];
                }
                result.push([authFailureCount, role, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_IDENTITY_PROVIDER_AUTHENTICATION_SUCCESS_COUNT,
        columns: ["authSuccessCount", "identityProvider", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "identityProvider", "xLabel"],
                "types": ["linear","ordinal","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "xTitle":"Identity Provider",
            "yTitle":"Successful Attempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["identityProvider", "authSuccessCount"] },
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_OVERALL, type: 9, filter:14 },
            { name: TYPE_FEDERATED, type: 9, filter:14 }
        ],
        mode: "IDENTITYPROVIDER",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var identityProvider = row["identityProvider"];
                var xLabel;
                if(row['identityProvider'].length > 12) {
                    xLabel = row['identityProvider'].substr(0, 10) + "..";
                } else {
                    xLabel =row['identityProvider'];
                }
                result.push([authSuccessCount, identityProvider, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_IDENTITY_PROVIDER_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "identityProvider", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "identityProvider", "xLabel"],
                "types": ["linear","ordinal","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "yTitle":"Failure Attempts",
            "xTitle":"Identity Provider",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["identityProvider", "authFailureCount"] },
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_OVERALL, type: 10, filter:14 },
            { name: TYPE_FEDERATED, type: 10, filter:14 }
        ],
        mode: "IDENTITYPROVIDER",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var identityProvider = row["identityProvider"];
                var xLabel;
                if(row['identityProvider'].length > 12) {
                    xLabel = row['identityProvider'].substr(0, 10) + "..";
                } else {
                    xLabel =row['identityProvider'];
                }
                result.push([authFailureCount, identityProvider, xLabel]);
            });
            return result;
        }
    },{
        name: ROLE_PER_SERVICE_PROVIDER_FIRST_LOGIN_COUNT,
        columns: ["authSuccessCount", "serviceProvider", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "serviceProvider","xLabel"],
                "types": ["linear","ordinal","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "xTitle":"Service Provider",
            "yTitle":"Successful Attempts",
            "maxLength":"3000",
            hoverCursor:"pointer",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "highlight" : "single",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["serviceProvider", "authSuccessCount"] },
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_OVERALL, type: 16, filter:13 },
            { name: TYPE_LOCAL, type: 16, filter:13 },
            { name: TYPE_FEDERATED, type: 16, filter:13 }
        ],
        mode: "FIRST_TIME_SERVICEPROVIDER",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var serviceProvider = row["serviceProvider"];
                var xLabel;
                if(row['serviceProvider'].length > 12) {
                    xLabel = row['serviceProvider'].substr(0, 10) + "..";
                } else {
                    xLabel =row['serviceProvider'];
                }
                result.push([authSuccessCount, serviceProvider, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_USERSTORE_AUTHENTICATION_SUCCESS_COUNT,
        columns: ["authSuccessCount", "userstore", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "userstore", "xLabel"],
                "types": ["linear","ordinal", "ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "xTitle":"User Store Domain",
            "yTitle":"Successful Attempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["userstore", "authSuccessCount"] },
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_LOCAL, type: 18, filter:17 }
        ],
        mode: "USERSTORE",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var userstore = row["userstore"];
                var xLabel;
                if(row['userstore'].length > 12) {
                    xLabel = row['userstore'].substr(0, 10) + "..";
                } else {
                    xLabel =row['userstore'];
                }
                result.push([authSuccessCount, userstore, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_USERSTORE_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "userstore", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "userstore", "xLabel"],
                "types": ["linear","ordinal","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "xTitle":"User Store Domain",
            "yTitle":"Failure Attempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":chartPadding,
            "tooltip":{"enabled":true, "content":["userstore", "authFailureCount"] },
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_LOCAL, type: 19, filter:17 }
        ],
        mode: "USERSTORE",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var userstore = row["userstore"];
                var xLabel;
                if(row['userstore'].length > 12) {
                    xLabel = row['userstore'].substr(0, 10) + "..";
                } else {
                    xLabel =row['userstore'];
                }
                result.push([authFailureCount, userstore, xLabel]);
            });
            return result;
        }
    }
];