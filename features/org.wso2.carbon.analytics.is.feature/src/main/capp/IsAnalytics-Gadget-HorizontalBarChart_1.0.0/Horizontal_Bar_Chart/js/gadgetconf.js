var charts = [{
    name: ROLE_PER_USER_AUTHENTICATION_SUCCESS_COUNT,
    columns: ["authSuccessCount", "username"],
    schema: [{
        "metadata": {
            "names": ["authSuccessCount", "username"],
            "types": ["linear","ordinal"]
        },
        "data": []
    }],
    "chartConfig":
    {
        "x":"username",
        "yTitle":"successfulAttempts",
        "xTitle":"Username",
        "maxLength":"3000",
        "barGap":0.2,
        "highlight" : "single",
        "colorScale":["#5CB85C"],
        "selectionColor":"#5BF85C",
        "padding":{"top":0,"left":100,"bottom":0,"right":20},
        "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
    types: [
        { name: TYPE_LANDING, type: 2, filter:12 },
        { name: TYPE_RESIDENT_IDP, type: 2, filter:12 }
    ],
    mode: "USERNAME",
    colorCode: "SUCCESS",
    isSelected: false,
    processData: function(data) {
        var result = [];
        data.forEach(function(row, i) {
            var authSuccessCount = row['authSuccessCount'];
            var username = row["username"];

            result.push([authSuccessCount, username]);
        });
        return result;
    }
}, {
    name: ROLE_PER_USER_AUTHENTICATION_FAILURE_COUNT,
    columns: ["authFailureCount", "username"],
    schema: [{
        "metadata": {
            "names": ["authFailureCount", "username"],
            "types": ["linear","ordinal"]
        },
        "data": []
    }],
    "chartConfig":
    {
        "x":"username",
        "maxLength":"3000",
        "xTitle":"Username",
        "yTitle":"failureAttempts",
        "highlight" : "single",
        "barGap":0.2,
        "padding":{"top":0,"left":100,"bottom":0,"right":20},
        "colorScale":["#D9534F"],
        "selectionColor":"#FF2112",
        "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
    types: [
        { name: TYPE_LANDING, type: 3, filter:12 },
        { name: TYPE_RESIDENT_IDP, type: 3, filter:12 }
    ],
    mode: "USERNAME",
    colorCode: "FAILURE",
    isSelected: false,
    processData: function(data) {
        var result = [];
        data.forEach(function(row, i) {
            var authFailureCount = row['authFailiureCount'];
            var username = row["username"];

            result.push([authFailureCount, username]);
        });
        return result;
    }
},{
    name: ROLE_PER_SERVICE_PROVIDER_AUTHENTICATION_SUCCESS_COUNT,
    columns: ["authSuccessCount", "serviceProvider"],
    schema: [{
        "metadata": {
            "names": ["authSuccessCount", "serviceProvider"],
            "types": ["linear","ordinal"]
        },
        "data": []
    }],
    "chartConfig":
    {
        "x":"serviceProvider",
        "yTitle":"successfulAttempts",
        "xTitle":"Service Provider",
        "maxLength":"3000",
        "highlight" : "single",
        "barGap":0.2,
        "colorScale":["#5CB85C"],
        "selectionColor":"#5BF85C",
        "padding":{"top":0,"left":100,"bottom":0,"right":20},
        "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
    types: [
        { name: TYPE_LANDING, type: 4, filter:13 },
        { name: TYPE_RESIDENT_IDP, type: 4, filter:13 }
    ],
    mode: "SERVICEPROVIDER",
    colorCode: "SUCCESS",
    isSelected: false,
    processData: function(data) {
        var result = [];
        data.forEach(function(row, i) {
            var authSuccessCount = row['authSuccessCount'];
            var serviceProvider = row["serviceProvider"];

            result.push([authSuccessCount, serviceProvider]);
        });
        return result;
    }
},
    {
        name: ROLE_PER_ROLE_AUTHENTICATION_SUCCESS_COUNT,
        columns: ["authSuccessCount", "role"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "role"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"role",
            "maxLength":"3000",
            "xTitle":"Role",
            "yTitle":"successfulAttempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 6, filter:15 },
            { name: TYPE_RESIDENT_IDP, type: 6, filter:15 }
        ],
        mode: "ROLE",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var role = row["role"];

                result.push([authSuccessCount, role]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_SERVICE_PROVIDER_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "serviceProvider"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "serviceProvider"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"serviceProvider",
            "maxLength":"3000",
            "yTitle":"failureAttempts",
            "xTitle":"Service Provider",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 5, filter:13 },
            { name: TYPE_RESIDENT_IDP, type: 5, filter:13 }
        ],
        mode: "SERVICEPROVIDER",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var serviceProvider = row["serviceProvider"];

                result.push([authFailureCount, serviceProvider]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_ROLE_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "role"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "role"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"role",
            "maxLength":"3000",
            "xTitle":"Role",
            "yTitle":"failureAttempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 7, filter:15 },
            { name: TYPE_RESIDENT_IDP, type: 7, filter:15 }
        ],
        mode: "ROLE",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var role = row["role"];

                result.push([authFailureCount, role]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_IDENTITY_PROVIDER_AUTHENTICATION_SUCCESS_COUNT,
        columns: ["authSuccessCount", "identityProvider"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "identityProvider"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"identityProvider",
            "maxLength":"3000",
            "xTitle":"Identity Provider",
            "yTitle":"successfulAttempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 9, filter:14 }
        ],
        mode: "IDENTITYPROVIDER",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var identityProvider = row["identityProvider"];

                result.push([authSuccessCount, identityProvider]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_IDENTITY_PROVIDER_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "identityProvider"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "identityProvider"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"identityProvider",
            "maxLength":"3000",
            "yTitle":"failureAttempts",
            "xTitle":"Identity Provider",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 10, filter:14 }
        ],
        mode: "IDENTITYPROVIDER",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var identityProvider = row["identityProvider"];

                result.push([authFailureCount, identityProvider]);
            });
            return result;
        }
    },{
        name: ROLE_PER_SERVICE_PROVIDER_FIRST_LOGIN_COUNT,
        columns: ["authSuccessCount", "serviceProvider"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "serviceProvider"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"serviceProvider",
            "xTitle":"Service Provider",
            "yTitle":"successfulAttempts",
            "maxLength":"3000",
            hoverCursor:"pointer",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 16, filter:13 },
            { name: TYPE_RESIDENT_IDP, type: 16, filter:13 }
        ],
        mode: "FIRST_TIME_SERVICEPROVIDER",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var serviceProvider = row["serviceProvider"];

                result.push([authSuccessCount, serviceProvider]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_USERSTORE_AUTHENTICATION_SUCCESS_COUNT,
        columns: ["authSuccessCount", "userstore"],
        schema: [{
            "metadata": {
                "names": ["authSuccessCount", "userstore"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"userstore",
            "maxLength":"3000",
            "xTitle":"User Store Domain",
            "yTitle":"successfulAttempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "selectionColor":"#5BF85C",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_RESIDENT_IDP, type: 18, filter:17 }
        ],
        mode: "USERSTORE",
        isSelected: false,
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var userstore = row["userstore"];

                result.push([authSuccessCount, userstore]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_USERSTORE_AUTHENTICATION_FAILURE_COUNT,
        columns: ["authFailureCount", "userstore"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "userstore"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"userstore",
            "maxLength":"3000",
            "xTitle":"User Store Domain",
            "yTitle":"failureAttempts",
            "highlight" : "single",
            "barGap":0.2,
            "colorScale":["#D9534F"],
            "selectionColor":"#FF2112",
            "padding":{"top":0,"left":100,"bottom":0,"right":20},
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_RESIDENT_IDP, type: 19, filter:17 }
        ],
        mode: "USERSTORE",
        isSelected: false,
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var userstore = row["userstore"];

                result.push([authFailureCount, userstore]);
            });
            return result;
        }
    }
];