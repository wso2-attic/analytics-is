import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';

let metadata = {
    names: ['contextId', 'username', 'serviceProvider', 'userStoreDomain', 'tenantDomain', 'rolesCommaSeparated', 'remoteIp', 'region', 'authSuccess', 'timeStamp'],
    types: ['ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'time']
};

let tableConfig = {
    charts: [
        {
            type: "table",
            columns: [
                {
                    "name": "contextId",
                    "title": "Context ID"
                },
                {
                    "name": "username",
                    "title": "User Name"
                },
                {
                    "name": "serviceProvider",
                    "title": "Service Provider"
                },
                {
                    "name": "userStoreDomain",
                    "title": "User Store"
                },
                {
                    "name": "tenantDomain",
                    "title": "Tenant Domain"
                },
                {
                    "name": "rolesCommaSeparated",
                    "title": "Roles"
                },
                {
                    "name": "remoteIp",
                    "title": "IP"
                },
                {
                    "name": "region",
                    "title": "Region"
                },
                {
                    "name": "authSuccess",
                    "title": "Authentication" // Change this
                },
                {
                    "name": "timeStamp",
                    "title": "Timestamp"
                }
            ]
        }
    ],
    maxLength: 100,
    pagination: true,
    filterable: true,
    append: false
};

class IsAnalyticsMessages extends Widget {
    constructor(props) {
        super(props);

        this.state = {
            tableConfig: tableConfig,
            data: [],
            metadata: metadata,
            faultyProviderConf: false,
            options: this.props.configs.options,
            width: this.props.glContainer.width,
            height: this.props.glContainer.height
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

        let tableConfigClone = _.cloneDeep(tableConfig);
        switch (this.state.options.authType) {
            case ("Local"):
                tableConfigClone.charts[0].columns[8].title = "Local Authentication";
                break;
            case ("Federated"):
                tableConfigClone.charts[0].columns[8].title = "Authentication Step Success";
                break;
            case ("Overall"):
                tableConfigClone.charts[0].columns[8].title = "Overall Authentication";
                break;
        }
        this.setState({
            tableConfig: tableConfigClone
        })
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    _handleDataReceived(message) {
        console.log("Handling Data\n");
        console.log("Data:", message.data);
        this.setState({
            metadata: message.metadata,
            data: message.data
        });
        window.dispatchEvent(new Event('resize'));
    }

    setReceivedMsg(receivedMsg) {
        this.setState({
            fromDate: receivedMsg.from,
            toDate: receivedMsg.to,
            data: []
        }, this.assembleQuery);
    }

    assembleQuery() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        let dataProviderConfigs = _.cloneDeep(this.state.dataProviderConf);
        let updatedQuery = dataProviderConfigs.configs.config.queryData.query;
        let authType = this.state.options.authType;
        let idpFilter = "";
        let doIdpFilter = false;

        updatedQuery = updatedQuery
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate);

        if (authType == "Local") {
            updatedQuery = updatedQuery.replace("{{authType}}", "authenticationSuccess");
            idpFilter = " on identityProviderType=='LOCAL' ";
            doIdpFilter = true;
        }
        else {
            updatedQuery = updatedQuery.replace("{{authType}}", "authStepSuccess");
            if (authType == "Federated") {
                idpFilter = " on identityProviderType=='FEDERATED' ";
                doIdpFilter = true;
            } else {
                idpFilter = "";
            }
        }

        if (doIdpFilter) {
            updatedQuery = updatedQuery.replace("{{filterCondition}}", idpFilter);
        } else {
            updatedQuery = updatedQuery.replace("{{filterCondition}}", "");
        }

        console.log(this.state.tableConfig.charts[0].columns[8].title, " Query: ", updatedQuery);
        dataProviderConfigs.configs.config.queryData.query = updatedQuery;

        super.getWidgetChannelManager().subscribeWidget(this.props.id, this._handleDataReceived, dataProviderConfigs);
    }

    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <Scrollbars style={{height: this.state.height}}>
                    <div
                        style={{
                            width: this.props.glContainer.width,
                            height: this.props.glContainer.height,
                        }}
                        className="list-table-wrapper"
                    >
                        <h1> Messages </h1>
                        <VizG
                            config={this.state.tableConfig}
                            metadata={this.state.metadata}
                            data={this.state.data}
                            append={false}
                            height={this.props.glContainer.height}
                            width={this.props.glContainer.width}
                            theme={this.props.muiTheme.name}
                        />
                    </div>
                </Scrollbars>
            </MuiThemeProvider>
        );
    }
}

global.dashboard.registerWidget('IsAnalyticsMessages', IsAnalyticsMessages);
