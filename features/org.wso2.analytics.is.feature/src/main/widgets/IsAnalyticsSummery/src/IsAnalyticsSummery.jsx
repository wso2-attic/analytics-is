import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';

let heading = "{{authType}} Login Attempts";

let bodyTextOverall = "Analyze overall login attempts made via WSO2 Identity Server.\n" +
    "This includes information about overall flows of authentication took place through Identity Server.\n" +
    "A collection of authentication steps is considered as an overall attempt";

let bodyTextLocal = "Analyze local login attempts made via WSO2 Identity Server.\n" +
    "Local login attempts include all login attempts which are done through resident IDP." +
    "These statistics will give an idea on the involvement of resident IDP in an authentication flow.";

let bodyTextFederated = "Analyze federated login attempts made via WSO2 Identity Server.\n" +
    "This will give an idea about the authentication steps took place via federated identity providers.";

let totalAttempts = 0;
let successCount = 0;
let failureCount = 0;

let successPercentage = "Success: {{successPercentage}}%";
let failurePercentage = "Failure: {{failurePercentage}}%";

let seeMoreLink = "overall";

let widgetConfigs = {
    totalAttempts: totalAttempts,
    successCount: successCount,
    failureCount: failureCount,
};

let widgetTexts = {
    heading: heading,
    bodyText: "",
    seeMoreLink: seeMoreLink,
};

let colorGreen = "#6ED460";
let colorRed = "#EC5D40";

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
            options: this.props.configs.options,
            widgetConfigs: widgetConfigs,
            widgetTexts: widgetTexts,
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

        let widgetTextsClone = _.cloneDeep(widgetTexts);
        switch (this.state.options.widgetType) {
            case ("Local"):
                widgetTextsClone.heading = heading.replace("{{authType}}", "Local");
                widgetTextsClone.seeMoreLink = window.location.href + "/../local";
                widgetTextsClone.bodyText = bodyTextLocal;
                break;
            case ("Federated"):
                widgetTextsClone.heading = heading.replace("{{authType}}", "Federated");
                widgetTextsClone.seeMoreLink = window.location.href + "/../federated";
                widgetTextsClone.bodyText = bodyTextFederated;
                break;
            case ("Overall"):
                widgetTextsClone.heading = heading.replace("{{authType}}", "Overall");
                widgetTextsClone.seeMoreLink = window.location.href + "/../overall";
                widgetTextsClone.bodyText = bodyTextOverall;
                break;
        }

        let widgetConfigClone = _.cloneDeep(widgetConfigs);
        widgetConfigClone.failureCount = this.state.widgetConfigs.failureCount;
        widgetConfigClone.successCount = this.state.widgetConfigs.successCount;

        let successPercentageValue = widgetConfigClone.successCount * 100 / widgetConfigClone.totalAttempts;
        let failurePercentageValue = widgetConfigClone.failureCount * 100 / widgetConfigClone.totalAttempts;

        widgetConfigClone.successPercentage = successPercentage
            .replace("{{successPercentage}}", successPercentageValue);
        widgetConfigClone.failurePercentage = failurePercentage
            .replace("{{failurePercentage}}", failurePercentageValue);

        this.setState ({
            widgetConfigs: widgetConfigClone,
            widgetTexts: widgetTextsClone,
        });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    _handleDataReceived(message) {
        let widgetConfigClone = _.cloneDeep(widgetConfigs);

        widgetConfigClone.totalAttempts = message.data[0][0] + message.data[0][1];
        widgetConfigClone.failureCount = message.data[0][0];
        widgetConfigClone.successCount = message.data[0][1];

        let successPercentageValue = parseFloat(widgetConfigClone.successCount * 100 / widgetConfigClone.totalAttempts)
            .toFixed(2);
        let failurePercentageValue = parseFloat(widgetConfigClone.failureCount * 100 / widgetConfigClone.totalAttempts)
            .toFixed(2);

        widgetConfigClone.successPercentage = successPercentage
            .replace("{{successPercentage}}", successPercentageValue);
        widgetConfigClone.failurePercentage = failurePercentage
            .replace("{{failurePercentage}}", failurePercentageValue);

        this.setState({
            widgetConfigs: widgetConfigClone,
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

        });
        window.dispatchEvent(new Event('resize'));
    }

    setReceivedMsg(receivedMsg) {
        let widgetConfigClone = _.cloneDeep(widgetConfigs);

        this.setState({
            per: receivedMsg.granularity,
            fromDate: receivedMsg.from,
            toDate: receivedMsg.to,
            pieChartData: [],
            numChartData: numChartData,
            widgetConfigs: widgetConfigClone,
        }, this.assembleQuery);
    }

    assembleQuery() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        let dataProviderConfigs = _.cloneDeep(this.state.dataProviderConf);
        let query = dataProviderConfigs.configs.config.queryData.query;
        let widgetType = this.state.options.widgetType;
        let filterCondition = " on identityProviderType=='{{idpType}}' ";
        let doFilter = false;

        let updatedQuery = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate);

        if (widgetType == "Local") {
            updatedQuery = updatedQuery.replace("{{authType}}", "authSuccessCount");
            filterCondition = filterCondition.replace("{{idpType}}", "LOCAL");
            this.state.seeMoreLink = "local";
            doFilter = true;
        }
        else {
            updatedQuery = updatedQuery.replace("{{authType}}", "authStepSuccessCount");
            this.state.seeMoreLink = "overall";
            if (widgetType == "Federated") {
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
        const successStyle = {
            color: colorGreen,
        };

        const  failureStyle = {
            color: colorRed,
        };
        if (this.state.faultyProviderConf) {
            return (
                <div style={{padding: 24}}>
                    <h3>{heading}</h3>
                    <h5>Data Provider Connection Error - Please check the provider configs</h5>
                </div>
            );
        }
        else if (this.state.widgetConfigs.totalAttempts === 0) {
            return (
                <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                    <Scrollbars style={{height: this.state.height}}>
                        <div style={{padding: 24}}>
                            <h2>{this.state.widgetTexts.heading}</h2>
                            <h4>
                                {this.state.widgetTexts.bodyText.split("\n").map((i, key) => {
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
                        <h2>{this.state.widgetTexts.heading}</h2>
                        <h4>
                            {this.state.widgetTexts.bodyText.split("\n").map((i, key) => {
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

                        <h6 style={successStyle}>{this.state.widgetConfigs.successPercentage}</h6>
                        <h6 style={failureStyle}>{this.state.widgetConfigs.failurePercentage}</h6>

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
