import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';

let heading = "{{authType}} Login Attempts";
let bodyText = "Analyze overall login attempts made via WSO2 Identity Server.\n" +
    "This includes information about overall flows of authentication took place through Identity Server.\n" +
    "A collection of authentication steps is considered as an overall attempt";
let values = "        Success: {{successCount}}\n" +
    "        Failure: {{failureCount}}\n";
let seeMoreLink = "overall";

let colorGreen = "#6ED460";
let colorRed = "#EC5D40";

let totalAttempts = 0;
let successCount = 0;
let failureCount = 0;

let pieChartMetadata = {
    names: ['attemptType', 'attemptCount'],
    types: ['ordinal', 'linear']
};

let numChartMetadata = {
    names: [
        "totalLoginAttempts"
    ],
    types: [
        "linear"
    ]
};

let numChartData = [
    [0],
    [0]
];

let pieChartConfig = {
    charts: [
        {
            type: "arc",
            x: "attemptCount",
            color: "attemptType",
            mode: "donut",
            colorScale: [colorRed, colorGreen]
        }
    ],
    //legendOrientation: "top",
    //percentage: true
};

let numChartConfig = {
    "x": "totalLoginAttempts",
    "title": "Total Login Attempts",
    "charts": [
        {
            "type": "number"
        }
    ],
    showDifference: false,
    showPercentage: false,
    showDecimal: false

};

class IsAnalyticsSummery extends Widget {
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,

            pieChartConfig: pieChartConfig,
            pieChartData: [],
            pieChartMetadata: pieChartMetadata,
            numChartConfig: numChartConfig,
            numChartData: numChartData,
            numChartMetadata: numChartMetadata,
            faultyProviderConf: false,
            totalAttempts: totalAttempts,
            successCount: successCount,
            failureCount: failureCount,
            values: values,
            heading: "",
            seeMoreLink: "overall",
            options: this.props.configs.options
        };

        this._handleDataReceived = this._handleDataReceived.bind(this);
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
                console.error("[ERROR]: ", error);
                this.setState({
                    faultyProviderConf: true
                });
            });

        let newHeading = _.clone(heading);
        let newSeeMoreLink = _.clone(seeMoreLink);
        switch (this.state.options.authType) {
            case ("Local"):
                newHeading = heading.replace("{{authType}}", "Local");
                newSeeMoreLink = window.location.href + "/../local";
                break;
            case ("Federated"):
                newHeading = heading.replace("{{authType}}", "Federated");
                newSeeMoreLink = window.location.href + "/../federated";
                break;
            case ("Overall"):
                newHeading = heading.replace("{{authType}}", "Overall");
                newSeeMoreLink = window.location.href + "/../overall";
                break;
        }
        let newValues = _.clone(values);
        newValues = newValues
            .replace("{{failureCount}}", this.state.failureCount)
            .replace("{{successCount}}", this.state.successCount);

        this.setState ({
            heading: newHeading,
            seeMoreLink: newSeeMoreLink,
            values: newValues
        });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    _handleDataReceived(message) {
        let newValues = _.clone(values);
        newValues = newValues
            .replace("{{failureCount}}", message.data[0][0])
            .replace("{{successCount}}", message.data[0][1]);

        this.setState({
            pieChartMetadata: pieChartMetadata,
            numChartMetadata: numChartMetadata,
            pieChartData: [
                [
                    "Failure",
                    message.data[0][0]
                ],
                [
                    "Success",
                    message.data[0][1]
                ]
            ],
            numChartData: [
                [
                    message.data[0][1]
                ],
                [
                    message.data[0][0] + message.data[0][1]
                ]
            ],
            totalAttempts: message.data[0][0] + message.data[0][1],
            failureCount: message.data[0][0],
            successCount: message.data[0][1],
            values: newValues
        });
        window.dispatchEvent(new Event('resize'));
    }

    setReceivedMsg(receivedMsg) {
        this.setState({
            per: receivedMsg.granularity,
            fromDate: receivedMsg.from,
            toDate: receivedMsg.to,
            pieChartData: [],
            numChartData: numChartData,
            totalAttempts: 0,
            failureCount: 0,
            successCount: 0
        }, this.assembleQuery);
    }

    assembleQuery() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        let dataProviderConfigs = _.cloneDeep(this.state.dataProviderConf);
        let query = dataProviderConfigs.configs.config.queryData.query;
        let authType = this.state.options.authType;
        let filterCondition = " on identityProviderType=='{{idpType}}' ";
        let doFilter = false;

        let updatedQuery = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate);

        if (authType == "Local") {
            updatedQuery = updatedQuery.replace("{{authType}}", "authSuccessCount");
            filterCondition = filterCondition.replace("{{idpType}}", "LOCAL");
            this.state.seeMoreLink = "local";
            doFilter = true;
        }
        else {
            updatedQuery = updatedQuery.replace("{{authType}}", "authStepSuccessCount");
            this.state.seeMoreLink = "overall";
            if (authType == "Federated") {
                filterCondition = filterCondition.replace("{{idpType}}", "FEDERATED");
                this.state.seeMoreLink = "federated";
                doFilter = true;
            }
        }

        if (doFilter) {
            updatedQuery = updatedQuery.replace("{{filterCondition}}", filterCondition);
        } else {
            updatedQuery = updatedQuery.replace("{{filterCondition}}", "");
        }

        dataProviderConfigs.configs.config.queryData.query = updatedQuery;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this._handleDataReceived, dataProviderConfigs);
    }

    render() {
        if (this.state.faultyProviderConf) {
            return (
                <div style={{padding: 24}}>
                    <h3>{heading}</h3>
                    <h5>Data Provider Connection Error - Please check the provider configs</h5>
                </div>
            );
        }
        else if (this.state.totalAttempts === 0) {
            return (
                <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                    <Scrollbars style={{height: this.state.height}}>
                        <div style={{padding: 24}}>
                            <h2>{this.state.heading}</h2>
                            <h4>
                                {bodyText.split("\n").map((i, key) => {
                                    return <div key={key}>{i}</div>;
                                })}
                            </h4>

                            <VizG config={numChartConfig}
                                  metadata={this.state.numChartMetadata}
                                  data={this.state.numChartData}
                                  width={this.state.width}
                                  height={this.state.height * 0.2}
                                  theme={this.props.muiTheme.name}
                            />
                            <h6>
                                {this.state.values.split("\n").map((i, key) => {
                                    return <div key={key}>{i}</div>;
                                })}
                            </h6>
                        </div>
                        <div>
                            <a href={this.state.seeMoreLink}>
                                <h5>See More >></h5>
                            </a>
                        </div>
                    </Scrollbars>
                </MuiThemeProvider>
            )
        }
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <Scrollbars style={{height: this.state.height}}>
                    <div style={{padding: 24}}>
                        <h2>{this.state.heading}</h2>
                        <h4>
                            {bodyText.split("\n").map((i, key) => {
                                return <div key={key}>{i}</div>;
                            })}
                        </h4>
                        <VizG config={numChartConfig}
                              metadata={this.state.numChartMetadata}
                              data={this.state.numChartData}
                              width={this.state.width}
                              height={this.state.height * 0.2}
                              theme={this.props.muiTheme.name}
                        />

                        <h6>
                            {this.state.values.split("\n").map((i, key) => {
                                return <div key={key}>{i}</div>;
                            })}
                        </h6>

                        <VizG config={this.state.pieChartConfig}
                              metadata={this.state.pieChartMetadata}
                              data={this.state.pieChartData}
                              width={this.state.width}
                              height={this.state.height * 0.55}
                              theme={this.props.muiTheme.name}
                        />
                    </div>
                    <div>
                        <a href={this.state.seeMoreLink}>
                            <h5>See More >></h5>
                        </a>
                    </div>
                </Scrollbars>
            </MuiThemeProvider>
        )
    }
}

global.dashboard.registerWidget('IsAnalyticsSummery', IsAnalyticsSummery);
