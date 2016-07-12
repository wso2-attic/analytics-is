var charts = [{
    name: ROLE_OVERALL_AUTHENTICATION_COUNT,
    columns: ["authActionCount", "timeStamp","authActionType"],
    schema: [{
        "metadata": {
            "names": ["authActionCount", "timeStamp","authActionType"],
            "types": ["linear", "time","ordinal"]
        },
        "data": []
    }],
    "chartConfig":{
        "x":"timeStamp",
        "maxLength":"3000",
        "legend" : false,
        "range":"true",
        "yTitle":"Authentication Attempts",
        "xTitle":"Time",
        "colorScale":["#5CB85C","#D9534F"],
        "colorDomain":["SUCCESS","FAILURE"],
        "rangeColor":"#737373",
        "padding":{
            "top":30,
            "left":65,
            "bottom":38,
            "right":10
        },
        "charts":[
            {
                type:"area",
                y:"authActionCount",
                color:"authActionType"
            }
        ]
    },
    types: [
        { name: TYPE_LANDING, type: 1 },
        { name: TYPE_RESIDENT_IDP, type: 1 }
    ],
    processData: function(data) {
        var result = [];
        var tableData = [];
        var overallAuthSuccessCount = 0;
        var overallAuthFailureCount = 0;

        data.forEach(function(row, i) {
            var timestamp = row['timestamp'];
            var successCount = row["successCount"];
            var faultCount = row["faultsCount"];
            overallAuthSuccessCount += successCount;
            overallAuthFailureCount += faultCount;

            tableData.push([successCount, timestamp, "AUTHSUCCESS"]);
            tableData.push([-faultCount,timestamp , "AUTHFAULT"]);
        });
        result.push(tableData);
        result.push(overallAuthSuccessCount);
        result.push(overallAuthFailureCount);

        return result;
    }
}];