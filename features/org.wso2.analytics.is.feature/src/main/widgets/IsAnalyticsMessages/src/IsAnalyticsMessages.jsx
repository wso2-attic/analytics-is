import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';

let metadata = {
  names: ['contextId', 'username', 'serviceProvider', 'userStoreDomain', 'tenantDomain', 'rolesCommaSeparated', 'remoteIp', 'region', 'authStepSuccess'],
  types: ['ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal']
}

let tableConfig= {
  "charts": [
    {
      "type": "table",
      uniquePropertyColumn: "contextId",
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
            "name": "authStepSuccess",
            "title": "Local Authentication"
        }
      ]
    }
  ],
  pagination: true,
  filterable: true,
}

class IsAnalyticsMessages extends Widget {
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,

            chartConfig: tableConfig,
            data: [],
            metadata: metadata,
            faultyProviderConf: false
        };

        this._handleDataReceived = this._handleDataReceived.bind(this);

        this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            })
        );
    }

    componentDidMount() {
        super.getWidgetConfiguration(this.props.widgetID)
          .then((message) => {
            super.getWidgetChannelManager().subscribeWidget(
              this.props.id, this._handleDataReceived, message.data.configs.providerConfig);
          })
          .catch((error) => {
            console.log("error", error);
          });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    _handleDataReceived(message) {
        const configClone = _.cloneDeep(tableConfig);

        this.setState({
            lineConfig: configClone,
            metadata: message.metadata,
            data: message.data
        });
        window.dispatchEvent(new Event('resize'));
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
            config={tableConfig}
            metadata={this.state.metadata}
            data={ this.state.data}
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
