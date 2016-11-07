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
        "xTicks":6,
        "colorScale":["#5CB85C","#D9534F"],
        "tooltip" : {"enabled":true, "color":"#e5f2ff", "type":"symbol", "content":["authActionCount","timeStamp","authActionType"], "label":true},
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
        { name: TYPE_OVERALL, type: 1 },
        { name: TYPE_LOCAL, type: 1 },
        { name: TYPE_FEDERATED, type: 1 }
    ]
}];
