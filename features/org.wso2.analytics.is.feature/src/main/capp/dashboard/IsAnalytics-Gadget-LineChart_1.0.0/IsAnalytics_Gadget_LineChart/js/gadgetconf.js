var charts = [{
    name: ROLE_SESSION_CHANGE_OVER_TIME,
    columns: ["sessionCount","timestamp", "sessionType"],
    schema: [{
        "metadata": {
            "names": ["sessionCount","timestamp", "sessionType"],
            "types": ["linear","time", "ordinal"]
        },
        "data": []
    }],
    chartConfig: {
        x: "timestamp",
        "xTitle":"Time",
        "yTitle":"Session Count",
        charts: [{ type: "line", range:"true",  y : "sessionCount", color: "sessionType" }],
        padding: { "top": 30, "left": 60, "bottom": 60, "right": 20 },
        colorDomain : ["Active", "New", "Terminated"],
        rangeColor:"#737373",
        range: true
    },
    types: [
        { name: TYPE_SESSIONS, type: 26 }
    ],
    processData: function(data) {
        var result = [];
        var schema = this.schema;
        var columns = this.columns;
        var timeUnit = data[1].timeUnit;
        var dataPoints = data[0];
        var minTimestamp = data[0].timestamp;
        var maxTimestamp = data[data.length-1].timestamp;
        var previousTimestamp = [];
        previousTimestamp["New"] = minTimestamp;
        previousTimestamp["Active"] = minTimestamp;
        previousTimestamp["Terminated"] = minTimestamp;
        var previousActiveSessionCount = 0;

        var step;
        if(timeUnit == "MINUTE") {
            step = 60000;
        } else if(timeUnit == "HOUR") {
            step = 3600000;
        } else if(timeUnit == "DAY") {
            step = 86400000;
        } else if(timeUnit == "MONTH") {
            step = 2628000000;
        } else if(timeUnit == "YEAR") {
            step = 31540000000;
        }

        dataPoints.forEach(function(row) {
            if((row.timestamp - previousTimestamp[row.sessionType]) > step) {
                var previousT = previousTimestamp[row.sessionType];
                for(var t=(previousT - previousT%step + step); t<row.timestamp; t=t+step) {
                    if(row.sessionType == "Active") {
                        var sameValuePoint = [previousActiveSessionCount, t, row.sessionType];
                        result.push(sameValuePoint);
                    } else {
                        var zeroValuePoint = [0, t, row.sessionType];
                        result.push(zeroValuePoint);
                    }
                }
            }
            previousTimestamp[row.sessionType] = row.timestamp;
            if(row.sessionType == "Active") {
                previousActiveSessionCount = row.sessionCount;
            }
            var record = [row.sessionCount, row.timestamp, row.sessionType];
            result.push(record);
        });
        return result;
    }
}];