import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';

let widgetPseudoId = "BarChardWidget_1_1_1";

let colorGreen = "#6ED460";
let colorRed = "#EC5D40";

let successMetadata = {
    names: ['username', 'authStepSuccessCount'],
    types: ['ordinal', 'linear']
};

let failureMetadata = {
    names: ['username', 'authFailureCount'],
    types: ['ordinal', 'linear']
};

let chartConfigSuccess = {
    x: "username",
    charts: [
        {
            type: "bar",
            orientation: "left",
            y: "authStepSuccessCount",
            fill: colorGreen,
            pagination: "true",
        },
    ],
    yAxisLabel: "Successful Attempts",
    xAxisLabel: "Username",
    yAxisTickCount: 10,
    pagination: "true",
    filterable: "true",
    maxLength: 10,
    linearSeriesStep: 1,
};

let chartConfigFailure = {
    x: "username",
    charts: [
        {
            type: "bar",
            orientation: "left",
            y: "authFailureCount",
            fill: colorRed,
            pagination: "true",
        }
    ],
    yAxisLabel: "Failure Attempts",
    xAxisLabel: "Username",
    yAxisTickCount: 10,
    pagination: "true",
    filterable: "true",
    maxLength: 10,
    linearSeriesStep: 1,
};

class IsAnalyticsHorizontalBarChart extends Widget {
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,

            chartConfigSuccess: chartConfigSuccess,
            chartConfigFailure: chartConfigFailure,
            successData: [],
            failureData: [],
            successMetadata: successMetadata,
            failureMetadata: failureMetadata,
            options: this.props.configs.options,
            faultyProviderConf: false,
            widgetPseudoId: widgetPseudoId,
        };

        this._handleSuccessDataReceived = this._handleSuccessDataReceived.bind(this);
        this._handleFailureDataReceived = this._handleFailureDataReceived.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
        this.setReceivedMsg = this.setReceivedMsg.bind(this);
        this.setConfigs = this.setConfigs.bind(this);

        this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            })
        );
    }

    componentDidMount() {
        this.setConfigs();
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

    setConfigs() {
        let successMetadata = _.cloneDeep(this.state.successMetadata);
        let failureMetadata = _.cloneDeep(this.state.failureMetadata);
        let chartConfigSuccess = _.cloneDeep(this.state.chartConfigSuccess);
        let chartConfigFailure = _.cloneDeep(this.state.chartConfigFailure);

        let widgetPseudoId = this.state.options.widgetType + this.state.options.xAxis + "_failure";

        let xAxisLabel = "";
        let xAxisValue = "";
        let header = "By ";

        switch (this.state.options.xAxis) {
            case "Service Provider":
                xAxisLabel = "Service Provider";
                header = header + "Service Provider";
                xAxisValue = "serviceProvider";
                break;
            case "User Store Domain":
                xAxisLabel = "User Store Domain";
                header = header + "User Store Domain";
                xAxisValue = "userStoreDomain";
                break;
            case "Role":
                xAxisLabel = "Role";
                header = header + "Role";
                xAxisValue = "role";
                break;
            case "Identity Provider":
                xAxisLabel = "Identity Provider";
                header = header + "Identity Provider";
                xAxisValue = "identityProvider";
                break;
            default:
                xAxisLabel = "Username";
                header = header + "Username";
                xAxisValue = "username";
        }

        widgetPseudoId = this.state.options.widgetType + xAxisValue + "_failure";

        chartConfigSuccess.x = xAxisValue;
        chartConfigSuccess.xAxisLabel = xAxisLabel;
        chartConfigFailure.x = xAxisValue;
        chartConfigFailure.xAxisLabel = xAxisLabel;

        successMetadata.names[0] = xAxisValue;
        failureMetadata.names[0] = xAxisValue;

        if (this.state.options.widgetType == "Local") {
            let value = "authSuccessCount";
            successMetadata.names[1] = value;
            chartConfigSuccess.charts[0].y = value;
        } else {
            let value = "authStepSuccessCount";
            successMetadata.names[1] = value;
            chartConfigSuccess.charts[0].y = value;
        }

        this.setState({
            successMetadata: successMetadata,
            failureMetadata: failureMetadata,
            chartConfigSuccess: chartConfigSuccess,
            chartConfigFailure: chartConfigFailure,
            widgetPseudoId: widgetPseudoId,
            header: header,
        })
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    _handleSuccessDataReceived(message) {
        this.setState({
            successData: message.data
        });

        window.dispatchEvent(new Event('resize'));
    }

    _handleFailureDataReceived(message) {
        this.setState({
            failureData: message.data
        });
        window.dispatchEvent(new Event('resize'));
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
        let dataProviderConfigsSuccess = _.cloneDeep(this.state.dataProviderConf);
        let query = dataProviderConfigsSuccess.configs.config.queryData.query;
        let countType = "authStepSuccessCount";
        let filterCondition = " on identityProviderType=='{{idpType}}' ";
        let doFilter = false;
        let xAxisValue = "";

        switch (this.state.options.xAxis) {
            case "Service Provider":
                xAxisValue = "serviceProvider";
                break;
            case "User Store Domain":
                xAxisValue = "userStoreDomain";
                break;
            case "Role":
                xAxisValue = "role";
                break;
            case "Identity Provider":
                xAxisValue = "identityProvider";
                break;
            default:
                xAxisValue = "username";
        }

        if (this.state.options.widgetType == "Local") {
            countType = "authSuccessCount";
            filterCondition = filterCondition.replace("{{idpType}}", "LOCAL");
            doFilter = true;
        } else {
            countType = "authStepSuccessCount";
            if (this.state.options.widgetType == "Federated") {
                filterCondition = filterCondition.replace("{{idpType}}", "FEDERATED");
                doFilter = true;
            }
        }

        if (doFilter) {
            query = query.replace("{{filterCondition}}", filterCondition);
        } else {
            query = query.replace("{{filterCondition}}", "");
        }

        query = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate)
            .replace(/{{xAxisValue}}/g, xAxisValue);

        let querySuccess = query
            .replace(/{{yAxisValue}}/g, countType);
        dataProviderConfigsSuccess.configs.config.queryData.query = querySuccess;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this._handleSuccessDataReceived, dataProviderConfigsSuccess);

        super.getWidgetChannelManager().unsubscribeWidget(widgetPseudoId);

        let dataProviderConfigsFailure = _.cloneDeep(this.state.dataProviderConf);
        let queryFailure = query
            .replace()
            .replace(/{{yAxisValue}}/g, "authFailureCount");
        dataProviderConfigsFailure.configs.config.queryData.query = queryFailure;

        console.log("Updated Query: ", queryFailure, "\nSuccess: ", querySuccess);

        console.log("Pseudo Id: ", this.state.widgetPseudoId);
        super.getWidgetChannelManager().subscribeWidget(this.state.widgetPseudoId, this._handleFailureDataReceived, dataProviderConfigsFailure);
    }

    render() {
        if (this.state.faultyProviderConf) {
            return (
                <div style={{padding: 24}}>
                    Unable to fetch data, please check the data provider configurations.
                </div>
            );
        }
        if (this.state.successData.length === 0 && this.state.failureData.length === 0) {
            return (
                <div style={{padding: 24}}>
                    <h3>{this.state.header}</h3>
                    <h5>No Data to Show</h5>
                </div>
            );
        }
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <Scrollbars style={{height: this.state.height}}>
                    <div style={{padding: 24}}>
                        <h3>{this.state.header}</h3>
                        <VizG config={this.state.chartConfigSuccess}
                              metadata={this.state.successMetadata}
                              data={this.state.successData}
                              width={this.state.width}
                              height={this.state.height * 0.45}
                              theme={this.props.muiTheme.name}
                        />
                        <VizG config={this.state.chartConfigFailure}
                              metadata={this.state.failureMetadata}
                              data={this.state.failureData}
                              height={this.state.height * 0.45}
                              width={this.state.width}
                              theme={this.props.muiTheme.name}
                        />
                    </div>
                </Scrollbars>
            </MuiThemeProvider>
        )
    }
}

global.dashboard.registerWidget('IsAnalyticsHorizontalBarChart', IsAnalyticsHorizontalBarChart);
