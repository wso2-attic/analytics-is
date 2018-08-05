import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from '@material-ui/core';
import {Scrollbars} from 'react-custom-scrollbars';
import _ from 'lodash';

let colorGreen = "#6ED460";
let colorRed = "#EC5D40";

let metadata = {
    names: ['timestamp', 'authSuccessCount', 'authFailureCount'],
    types: ['time', 'linear', 'linear'],
};

let chartConfig = {
    x: "timestamp",
    charts: [
        {
            type: "area",
            y: "authSuccessCount",
            fill: colorGreen
        },
        {
            type: "area",
            y: "authFailureCount",
            fill: colorRed
        }
    ],
    yAxisLabel: "Authentication Attempts",
    xAxisLabel: "Time",
    tipTimeFormat: "%Y %B %d",
    maxLength: 6,
    legend: false,
    append: false,
};

class IsAnalyticsAttemptsOverTime extends Widget {
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
        };

        this._handleDataReceived = this._handleDataReceived.bind(this);
        this.setReceivedMsg = this.setReceivedMsg.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);

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
        {message.data.map((dataSet) => {
            dataSet[0] = parseInt(dataSet[0]) * 1000; // JS use Milliseconds for timestamp values.
            dataSet[1] = parseInt(dataSet[1]);
            dataSet[2] = parseInt(dataSet[2]) * -1;
        })}

        this.setState({
            data: message.data,
        });
        window.dispatchEvent(new Event('resize'));
    }

    render() {
        if (this.state.data.length === 0) {
            return (
                <Scrollbars style={{height: this.state.height}}>
                    <h3> Login Attempts Over Time </h3>
                </Scrollbars>
            )
        }
        return (
            <Scrollbars style={{height: this.state.height}}>
                <h3> Login Attempts Over Time </h3>
                <VizG
                    config={this.state.chartConfig}
                    metadata={this.state.metadata}
                    data={this.state.data}
                    height={this.state.height * 0.45}
                />
            </Scrollbars>
        );
    }
}

global.dashboard.registerWidget('IsAnalyticsAttemptsOverTime', IsAnalyticsAttemptsOverTime);
