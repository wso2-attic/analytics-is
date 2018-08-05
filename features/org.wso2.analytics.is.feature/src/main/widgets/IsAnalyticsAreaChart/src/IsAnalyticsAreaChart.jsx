import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from '@material-ui/core';
import {Scrollbars} from 'react-custom-scrollbars';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import _ from 'lodash';

let colorWhite = "#FFFFFF";
let colorGreen = "#6ED460";
let colorRed = "#EC5D40";

let colorScaleSuccess = [
    colorWhite,
    colorGreen,
];

let colorScaleFailure = [
    colorWhite,
    colorRed,
];

let metadata = {
    names: ['region', 'authSuccessCount', 'authFailureCount'],
    types: ['ordinal', 'linear', 'linear'],
};

let chartConfig = {
    "type": "map",
    "x": "region",
    "charts": [
        {
            "type": "map",
            "y": "authSuccessCount",
            "mapType": "world",
            "colorScale": colorScaleSuccess,
        }
    ]
};

class IsAnalyticsAreaChart extends Widget {
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,

            chartConfig: chartConfig,
            data: [],
            metadata: metadata,
            faultyProviderConf: false,
            options: this.props.configs.options,
            isFailureMap: false,
            switchLabel: "Success",
        };

        this._handleDataReceived = this._handleDataReceived.bind(this);
        this.setReceivedMsg = this.setReceivedMsg.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
        this.changeMapType = this.changeMapType.bind(this);

        this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            })
        );
    }

    componentDidMount() {
        super.subscribe(this.setReceivedMsg);
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    dataProviderConf: message.data.configs.providerConfig
                });
            })
            .catch((error) => {
                console.error("[ERROR]: ", error);
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    setReceivedMsg(receivedMsg) {
        this.setState({
            per: receivedMsg.granularity,
            fromDate: receivedMsg.from,
            toDate: receivedMsg.to,
            successData: [],
            failureData: []
        }, this.assembleQuery);
    }

    assembleQuery() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);

        let dataProviderConfig = _.cloneDeep(this.state.dataProviderConf);
        let query = dataProviderConfig.configs.config.queryData.query;
        let filterCondition = " on identityProviderType=='{{idpType}}' ";
        let countType = "";
        let doFilter = false;

        if (this.state.options.widgetType === "Local") {
            countType = "authSuccessCount";
            filterCondition = filterCondition.replace("{{idpType}}", "LOCAL");
            doFilter = true;

        } else {
            countType = "authStepSuccessCount";
            if (this.state.options.widgetType === "Federated") {
                filterCondition = filterCondition.replace("{{idpType}}", "FEDERATED");
                doFilter = true;
            }
        }

        query = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate)
            .replace(/{{countType}}/g, countType);

        if (doFilter) {
            query = query.replace("{{filterCondition}}", filterCondition);
        } else {
            query = query.replace("{{filterCondition}}", "");
        }

        dataProviderConfig.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this._handleDataReceived, dataProviderConfig);
    }

    _handleDataReceived(message) {
        // Adding 0,0 value inorder to set the scale lower bound to 0 in area chart
        let dataCopy = message.data;
        dataCopy[message.data.length] = ["N/A", 0, 0];
        this.setState({
            metadata: message.metadata,
            data: dataCopy,
        });
        window.dispatchEvent(new Event('resize'));
    }

    changeMapType(event) {
        let chartConfigClone = _.cloneDeep(chartConfig);
        let switchLabel = _.clone(this.state.switchLabel);

        if (switchLabel === "Failure") {
            chartConfigClone.charts[0].colorScale = colorScaleSuccess;
            chartConfigClone.charts[0].y = "authSuccessCount";
            switchLabel = "Success";
        } else if (switchLabel === "Success") {
            chartConfigClone.charts[0].colorScale = colorScaleFailure;
            chartConfigClone.charts[0].y = "authFailureCount";
            switchLabel = "Failure";
        }

        console.log("Chart Config: ", chartConfigClone, "\nLabel: ", switchLabel);
        this.setState({
            chartConfig: chartConfigClone,
            isFailureMap: event.target.checked,
            switchLabel: switchLabel,
        });
    };

    render() {
        return (
            <Scrollbars style={{height: this.state.height}}>
                <h3> Area Chart </h3>
                <VizG
                    config={this.state.chartConfig}
                    metadata={this.state.metadata}
                    data={this.state.data}
                    height={this.state.height * 0.3}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={this.state.isFailureMap}
                            onChange={this.changeMapType}
                        />
                    }
                    label={this.state.switchLabel}
                />
            </Scrollbars>
        );
    }
}

global.dashboard.registerWidget('IsAnalyticsAreaChart', IsAnalyticsAreaChart);
