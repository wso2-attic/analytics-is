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
            "maxLength":"3000",
            "barGap":0.5,
            highlight : "multi",
            "colorScale":["#5CB85C"],
            "padding":{"top":30,"left":100,"bottom":38,"right":55},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
    types: [
        { name: TYPE_LANDING, type: 2 }
    ],
    mode: "USERNAME",
    colorCode: "SUCCESS",
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
        "yTitle":"failureAttempts",
        "barGap":0.5,
        "padding":{"top":30,"left":100,"bottom":38,"right":55},
        "colorScale":["#D9534F"],
        "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
    types: [
        { name: TYPE_LANDING, type: 3 }
    ],
    mode: "USERNAME",
    colorCode: "FAILURE",
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
    columns: ["authSuccessCount", "serviceprovider"],
    schema: [{
        "metadata": {
            "names": ["authSuccessCount", "serviceprovider"],
            "types": ["linear","ordinal"]
        },
        "data": []
    }],
    "chartConfig":
    {
        "x":"serviceprovider",
        "yTitle":"successfulAttempts",
        "maxLength":"3000",
        "barGap":0.5,
        "colorScale":["#5CB85C"],
        "padding":{"top":30,"left":100,"bottom":38,"right":55},
        "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
    types: [
        { name: TYPE_LANDING, type: 4 }
    ],
    mode: "SERVICEPROVIDER",
    colorCode: "SUCCESS",
    processData: function(data) {
        var result = [];
        data.forEach(function(row, i) {
            var authSuccessCount = row['authSuccessCount'];
            var serviceprovider = row["serviceprovider"];

            result.push([authSuccessCount, serviceprovider]);
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
            "yTitle":"successfulAttempts",
            "barGap":0.5,
            "colorScale":["#5CB85C"],
            "padding":{"top":30,"left":100,"bottom":38,"right":55},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 6 }
        ],
        mode: "ROLE",
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
        columns: ["authFailureCount", "serviceprovider"],
        schema: [{
            "metadata": {
                "names": ["authFailureCount", "serviceprovider"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"serviceprovider",
            "maxLength":"3000",
            "yTitle":"failureAttempts",
            "barGap":0.5,
            "colorScale":["#D9534F"],
            "padding":{"top":30,"left":100,"bottom":38,"right":55},
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 5 }
        ],
        mode: "SERVICEPROVIDER",
        colorCode: "FAILURE",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authFailureCount = row['authFailiureCount'];
                var serviceprovider = row["serviceprovider"];

                result.push([authFailureCount, serviceprovider]);
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
            "yTitle":"failureAttempts",
            "barGap":0.5,
            "colorScale":["#D9534F"],
            "padding":{"top":30,"left":100,"bottom":38,"right":55},
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 7 }
        ],
        mode: "ROLE",
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
            "yTitle":"successfulAttempts",
            "barGap":0.5,
            "colorScale":["#5CB85C"],
            "padding":{"top":30,"left":100,"bottom":38,"right":55},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 9 }
        ],
        mode: "IDENTITYPROVIDER",
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
            "barGap":0.5,
            "colorScale":["#D9534F"],
            "padding":{"top":30,"left":100,"bottom":38,"right":55},
            "charts":[{type: "bar",  y : "authFailureCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 10 }
        ],
        mode: "IDENTITYPROVIDER",
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
        name: ROLE_PER_IDENTITY_PROVIDER_FIRST_LOGIN_COUNT,
        columns: ["authSuccessCount", "serviceprovider"],
        schema: [{
                     "metadata": {
                         "names": ["authSuccessCount", "serviceprovider"],
                         "types": ["linear","ordinal"]
                     },
                     "data": []
                 }],
        "chartConfig":
        {
            "x":"serviceprovider",
            "yTitle":"successfulAttempts",
            "maxLength":"3000",
            "barGap":0.5,
            "colorScale":["#5CB85C"],
            "padding":{"top":30,"left":100,"bottom":38,"right":55},
            "charts":[{type: "bar",  y : "authSuccessCount", orientation : "left"}]},
        types: [
            { name: TYPE_LANDING, type: 16 }
        ],
        mode: "FIRST_TIME_SERVICEPROVIDER",
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var authSuccessCount = row['authSuccessCount'];
                var serviceprovider = row["serviceprovider"];

                result.push([authSuccessCount, serviceprovider]);
            });
            return result;
        }
    }
];