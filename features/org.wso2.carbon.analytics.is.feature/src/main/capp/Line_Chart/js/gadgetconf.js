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
        charts: [{ type: "line", range:"true",  y : "sessionCount", color: "sessionType" }],
        padding: { "top": 30, "left": 60, "bottom": 60, "right": 100 },
        range: true,
    },
    types: [
        { name: TYPE_SESSIONS, type: 25 }
    ],
    processData: function(data) {
        var result = [];
        var schema = this.schema;
        var columns = this.columns;
        var data = data[0];
        data.forEach(function(row) {
            var record = [row.sessionCount, row.timestamp, row.sessionType];
            result.push(record);
        });
        return result;
    }
}];