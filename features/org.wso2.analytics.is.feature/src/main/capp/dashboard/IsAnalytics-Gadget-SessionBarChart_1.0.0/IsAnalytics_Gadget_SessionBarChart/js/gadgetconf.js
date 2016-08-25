var charts = [
    {
        name: ROLE_TOP_LONGEST_SESSIONS,
        columns: ["duration", "username", "sessionId", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["duration", "username", "sessionId", "xLabel"],
                "types": ["linear","ordinal","ordinal", "ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "yTitle":"Duration",
            "xTitle":"Username",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "legend":false,
            "padding":{"top":10,"left":120,"bottom":40,"right":30},
            "tooltip":{"enabled":true, "content":["username", "duration"] },
            "charts":[{type: "bar",  y : "duration", orientation : "left", mode:"group", color:"sessionId"}]},
        types: [
            { name: TYPE_SESSIONS, type: 21 }
        ],
        mode: "TOP_LONGEST_SESSIONS",
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var duration = row['duration'];
                var username = row['username'];
                var sessionId = row['sessionId'];
                var xLabel;
                if(row['username'].length > 12) {
                    xLabel = row['username'].substr(0, 10) + "..";
                } else {
                    xLabel =row['username'];
                }
                result.push([duration, username, sessionId, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_PER_USER_AVERAGE_SESSION_DURATION,
        columns: ["duration", "username", "xLabel"],
        schema: [{
            "metadata": {
                "names": ["duration", "username", "xLabel"],
                "types": ["linear","ordinal", "ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"xLabel",
            "maxLength":"3000",
            "yTitle":"Duration",
            "xTitle":"Username",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "padding":{"top":10,"left":120,"bottom":40,"right":30},
            "tooltip":{"enabled":true, "content":["username", "duration"] },
            "charts":[{type: "bar",  y : "duration", orientation : "left"}]},
        types: [
            { name: TYPE_SESSIONS, type: 22 }
        ],
        mode: "SESSION_DURATION",
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var duration = row['duration'];
                var username = row['username'];
                var xLabel;
                if(row['username'][0].length > 12) {
                    xLabel = row['username'][0].substr(0, 10) + "..";
                } else {
                    xLabel =row['username'][0];
                }
                result.push([duration, username, xLabel]);
            });
            return result;
        }
    },
    {
        name: ROLE_SESSION_COUNT_OVER_TIME,
        columns: ["sessionCount", "duration"],
        schema: [{
            "metadata": {
                "names": ["sessionCount", "duration"],
                "types": ["linear","ordinal"]
            },
            "data": []
        }],
        "chartConfig":
        {
            "x":"duration",
            "maxLength":"3000",
            "yTitle":"Session Count",
            "xTitle":"Duration",
            "barGap":0.2,
            "colorScale":["#5CB85C"],
            "padding":{"top":10,"left":100,"bottom":40,"right":30},
            "charts":[{type: "bar",  y : "sessionCount"}]},
        types: [
            { name: TYPE_SESSIONS, type: 23 }
        ],
        mode: "SESSION_COUNT_OVER_TIME",
        colorCode: "SUCCESS",
        processData: function(data) {
            var result = [];
            data.forEach(function(row, i) {
                var sessionCount = row['sessionCount'];
                var timestamp = row['duration'];

                result.push([sessionCount, timestamp]);
            });
            return result;
        }
    }
];