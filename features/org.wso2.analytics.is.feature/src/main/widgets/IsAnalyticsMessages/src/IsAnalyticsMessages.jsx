import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';

let colorGreen = "#6ED460";
let colorRed = "#EC5D40";

let metadataOverall = {
    names: ['contextId', 'username', 'serviceProvider', 'authenticationStep', 'rolesCommaSeparated','tenantDomain', 'remoteIp', 'region', 'authSuccess', 'utcTime'],
    types: ['ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal']
};

let metadataLocal = {
    names: ['contextId', 'username', 'serviceProvider', 'userStoreDomain', 'tenantDomain', 'rolesCommaSeparated', 'remoteIp', 'region', 'authSuccess', 'utcTime'],
    types: ['ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal']
};

let metadataFederated = {
    names: ['contextId', 'username', 'serviceProvider', 'identityProvider', 'remoteIp', 'region', 'authSuccess', 'utcTime'],
    types: ['ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal']
};

let columnsOverall = [
    {
        name: "contextId",
        title: "Context ID"
    },
    {
        name: "username",
        title: "User Name"
    },
    {
        name: "serviceProvider",
        title: "Service Provider"
    },
    {
        name: "authenticationStep",
        title: "Subject Step"
    },
    {
        name: "rolesCommaSeparated",
        title: "Roles"
    },
    {
        name: "tenantDomain",
        title: "Tenant Domain"
    },
    {
        name: "remoteIp",
        title: "IP"
    },
    {
        name: "region",
        title: "Region"
    },
    {
        name: "authSuccess",
        title: "Overall Authentication",
        colorBasedStyle: true,
        colorScale: [colorGreen, colorRed],
    },
    {
        name: "utcTime",
        title: "Timestamp"
    }
];

let columnsLocal = [
    {
        name: "contextId",
        title: "Context ID"
    },
    {
        name: "username",
        title: "User Name"
    },
    {
        name: "serviceProvider",
        title: "Service Provider"
    },
    {
        name: "userStoreDomain",
        title: "User Store"
    },
    {
        name: "tenantDomain",
        title: "Tenant Domain"
    },
    {
        name: "rolesCommaSeparated",
        title: "Roles"
    },
    {
        name: "remoteIp",
        title: "IP"
    },
    {
        name: "region",
        title: "Region"
    },
    {
        name: "authSuccess",
        title: "Local Authentication",
        colorBasedStyle: true,
        colorScale: [colorGreen, colorRed],
    },
    {
        name: "utcTime",
        title: "Timestamp"
    }
];

let columnsFederated = [
    {
        name: "contextId",
        title: "Context ID"
    },
    {
        name: "username",
        title: "User Name"
    },
    {
        name: "serviceProvider",
        title: "Service Provider"
    },
    {
        name: "identityProvider",
        title: "identityProvider"
    },
    {
        name: "remoteIp",
        title: "IP"
    },
    {
        name: "region",
        title: "Region"
    },
    {
        name: "authSuccess",
        title: "Authentication Step Success",
        colorBasedStyle:true,
        colorScale: [colorGreen, colorRed],
    },
    {
        name: "utcTime",
        title: "Timestamp"
    }
];

let tableConfig = {
    charts: [
        {
            type: "table",
        }
    ],
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
        let metadata = [];
        switch (this.state.options.authType) {
            case ("Local"):
                tableConfigClone.charts[0].columns = columnsLocal;
                metadata = metadataLocal;
                break;
            case ("Federated"):
                tableConfigClone.charts[0].columns = columnsFederated;
                metadata = metadataFederated;
                break;
            case ("Overall"):
                tableConfigClone.charts[0].columns = columnsOverall;
                metadata = metadataOverall;
                break;
        }
        this.setState({
            tableConfig: tableConfigClone,
            metadata: metadata,
        })
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    _handleDataReceived(message) {
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
        let filterCondition = " on _timestamp > {{from}}L and _timestamp < {{to}}L ";
        let idpFilter = " and identityProviderType=='{{idpType}}'";
        let doIdpFilter = false;

        filterCondition = filterCondition
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate);

        if (authType == "Local") {
            updatedQuery = updatedQuery.replace("{{authType}}", "authenticationSuccess");
            idpFilter = idpFilter.replace("{{idpType}}", "LOCAL");
            doIdpFilter = true;
        }
        else {
            updatedQuery = updatedQuery.replace("{{authType}}", "authStepSuccess");

            if (authType == "Federated") {
                idpFilter = idpFilter.replace("{{idpType}}", "FEDERATED");
                doIdpFilter = true;
            }
        }

        if (doIdpFilter) {
            filterCondition = filterCondition + idpFilter;
        }

        updatedQuery = updatedQuery.replace("{{filterCondition}}", filterCondition);
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
