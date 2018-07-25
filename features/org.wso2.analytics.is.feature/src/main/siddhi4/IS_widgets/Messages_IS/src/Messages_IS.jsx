import React, {Component} from "react";
import Widget from "@wso2-dashboards/widget";
import VizG from 'react-vizgrammar';
import {Scrollbars} from 'react-custom-scrollbars';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import _ from 'lodash';
import moment from 'moment';

class Messages_IS extends Widget{
    constructor(props){
        super(props);

        this.ChartConfig ={
            "charts": [
                {
                    "type": "table",
                    "columns": [
                    {
                        "name": "username",
                        "title": "Username"
                    },
                    {
                        "name": "startTimestamp",
                        "title": "Start Time"
                    },
                    {
                        "name": "terminationTimestamp",
                        "title": "Termination Time"
                    },
                    {
                        "name": "endTimestamp",
                        "title": "End Time"
                    },
                    {
                        "name": "duration",
                        "title": "Duration (ms)"
                    },
                    {
                        "name": "isActive",
                        "title": "Is Active"
                    },
                    {
                        "name": "userstoreDomain",
                        "title": "User Store Domain"
                    },
                    {
                        "name": "tenantDomain",
                        "title": "Tenant Domain"
                    },
                    {
                        "name": "remoteIp",
                        "title": "Ip"
                    },
                    {
                        "name": "rememberMeFlag",
                        "title": "Remember Me Flag"
                    },
                    {
                        "name": "timeStamp",
                        "title": "Timestamp"
                    }
                    ]
                }
            ],
            "pagination": true,
            "filterable": true,
            "append": false
        };

        this.metadata = {
            names: ['username', 'startTimestamp', 'terminationTimestamp', 'endTimestamp', 'duration', 'isActive', 'userstoreDomain', 'tenantDomain', 'remoteIp', 'rememberMeFlag', 'timeStamp'],
            types: ['ordinal', 'ordinal', 'ordinal', 'ordinal', 'time', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal', 'ordinal']
        };

        this.state ={
                    data: [],
                    metadata: this.metadata,
                    width: this.props.glContainer.width,
                    height: this.props.glContainer.height,
                    btnGroupHeight: 100,
                    dataType: 'hour',
                    dataHourBtnClicked: false,
                    dataMinuteBtnClicked: false,
                };
        this.handleResize = this.handleResize.bind(this);
        this.props.glContainer.on('resize', this.handleResize);
        this._handleDataReceived = this._handleDataReceived.bind(this);
        this.setReceivedMsg = this.setReceivedMsg.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
    }
    handleResize(){
        this.setState({width: this.props.glContainer.width, height: this.props.glContainer.height});
    }
    componentDidMount(){
        console.log("Component Did Mount\n");
        console.log("Configs: ", super.getWidgetConfiguration(this.props.widgetID));

        super.subscribe(this.setReceivedMsg);
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig
                });
            })

          console.log("Done Mount");
    }
    componentWillUnmount(){
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }
    _handleDataReceived(message){
        console.log("Handling received Data\n", message);
          message.data.map((number) =>
         {
         console.log(number);

         for(let i = 0; i < 10; i++) {

          switch(i){

          case 1:
                number[1]=moment(number[1]).format('MMMM Do YYYY, h:mm:ss a');
                break;

          case 2:
                number[2]=moment(number[2]).format('MMMM Do YYYY, h:mm:ss a');
                break;

          case 3:
                number[3]=moment(number[3]).format('MMMM Do YYYY, h:mm:ss a');
                break;

          case 4:
                number[10]=moment(number[10]).format('MMMM Do YYYY, h:mm:ss a');
                break;
          }

         }
         }
)
        this.setState({
            //lineConfig: tableConfig,
            metadata: message.metadata,
            data: message.data
        });
    }
    setReceivedMsg(receivedMsg){
    console.log("Received data successfully\n", receivedMsg);
        this.setState({
        //   per: receivedMsg.granularity,
            fromDate: receivedMsg.from,
            toDate: receivedMsg.to
        }, this.assembleQuery);
    console.log("done setReceieve");
    }
    assembleQuery(){
    console.log("assemble");
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        console.log("getting channel");
        let dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
       // console.log("done clonning/n",providerConfig );
        //console.log('this.state.providerConfig');
        let query = dataProviderConfigs.configs.config.queryData.query;
                console.log("querying");
        query = query
           // .replace("{{per}}", this.state.per)
            .replace('begin', this.state.fromDate)
            .replace('finish', this.state.toDate);
        dataProviderConfigs.configs.config.queryData.query = query;

        console.log(query);
        console.log(dataProviderConfigs);
        super.getWidgetChannelManager()
            .subscribeWidget(this.props.id, this._handleDataReceived, dataProviderConfigs);
        console.log("assembling data ends");


    }
    render(){
    console.log("In render\n");
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <section style={{paddingTop: 50}}>
                    <VizG
                        config={this.ChartConfig}
                        metadata={this.state.metadata}
                        data={this.state.data}
                        height={this.state.height - this.state.btnGroupHeight}
                        width={this.state.width}
                        theme={this.props.muiTheme.name}
                    />
                </section>
            </MuiThemeProvider>
        );
        console.log("Left render\n");
    }
}
global.dashboard.registerWidget("Messages_IS", Messages_IS);