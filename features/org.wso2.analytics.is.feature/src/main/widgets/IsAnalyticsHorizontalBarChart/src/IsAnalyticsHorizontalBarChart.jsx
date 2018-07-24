import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';

let successMetadata = {
  names: ['username', 'authSuccessCount'],
  types: ['ordinal', 'ordinal']
}

let failureMetadata = {
    names: ['username', 'authFailureCount'],
    types: ['ordinal', 'ordinal']
}

let chartConfigSuccess= {
   "x": "username",
   "charts": [
       {
           "type": "bar",
           //"orientation": "left",
           "y": "authSuccessCount"
       }
   ],
   "yAxisLabel": "Successful Attempts",
   "xAxisLabel": "Username",
   "pagination": "true",
   "filterable": "true"
}

let chartConfigFailure = {
    "x": "username",
       "charts": [
           {
               "type": "bar",
               //"orientation": "left",
               "y": "authFailureCount"
           }
       ],
       "yAxisLabel": "Failure Attempts",
       "xAxisLabel": "Username",
       "pagination": "true",
       "filterable": "true"
}

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
            faultyProviderConf: false
        };

        this._handleSuccessDataReceived = this._handleSuccessDataReceived.bind(this);
        this._handleFailureDataReceived = this._handleFailureDataReceived.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
        this.setReceivedMsg = this.setReceivedMsg.bind(this);

        this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
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
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    _handleSuccessDataReceived(message) {
        console.log("Success Metadata: ", message.metadata);
        this.setState({
            successMetadata: message.metadata,
            successData: message.data
        });

        window.dispatchEvent(new Event('resize'));
        console.log("Dispatched Event Success");
    }

    _handleFailureDataReceived(message) {
        console.log("Failure Metadata: ", message.metadata);
        this.setState({
            failureMetadata: message.metadata,
            failureData: message.data
        });

        window.dispatchEvent(new Event('resize'));
        console.log("Dispatched Event Failure");
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
        console.log("Assembling the query");
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        let dataProviderConfigsSuccess = _.cloneDeep(this.state.dataProviderConf);
        let query = dataProviderConfigsSuccess.configs.config.queryData.query;

        let querySuccess = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate)
            .replace(/{{countType}}/g, "authSuccessCount");
        dataProviderConfigsSuccess.configs.config.queryData.query = querySuccess;

        console.log("Query: ", querySuccess);

        super.getWidgetChannelManager().subscribeWidget(this.props.id, this._handleSuccessDataReceived, dataProviderConfigsSuccess);

        super.getWidgetChannelManager().unsubscribeWidget("BarChardWidget_1_1_1");
        let dataProviderConfigsFailure = _.cloneDeep(this.state.dataProviderConf);

        let queryFailure = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate)
            .replace(/{{countType}}/g, "authFailureCount");
        dataProviderConfigsFailure.configs.config.queryData.query = queryFailure;

        console.log("Query: ", queryFailure);

        super.getWidgetChannelManager().subscribeWidget("BarChardWidget_1_1_1", this._handleFailureDataReceived, dataProviderConfigsFailure);
    }

    render() {
        if (this.state.faultyProviderConf) {
            return (
                <div
                    style={{
                        padding: 24
                    }}
                >
                    Unable to fetch data, please check the data provider configurations.
                </div>
            );
        }
        if(this.state.successData.length === 0 && this.state.failureData.length === 0) {
            return(
                <div
                    style={{
                        padding: 24
                    }}
                >
                    <h1>No Data to Show</h1>
                </div>
            );
        }

        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <Scrollbars style={{height: this.state.height}}>
                <div style={{padding: 24}}>
                    <h3> Login Attempts </h3>
                    <VizG config={chartConfigSuccess}
                        metadata={this.state.successMetadata}
                        data={ this.state.successData}
                        width={this.state.width}
                        height={this.state.height * 0.45}
                        theme={this.props.muiTheme.name}
                    />
                    <VizG config={chartConfigFailure}
                        metadata={this.state.failureMetadata}
                        data={ this.state.failureData}
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
