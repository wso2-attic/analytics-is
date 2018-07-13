import React, {Component} from 'react';
import VizG from 'react-vizgrammar';
import Widget from '@wso2-dashboards/widget';
import {MuiThemeProvider, darkBaseTheme, getMuiTheme} from 'material-ui/styles';
import RaisedButton from 'material-ui/RaisedButton';

class ISLineChart extends Widget {
    constructor(props) {
        super(props);

        this.ChartConfig =
        {
            "x": "AGG_TIMESTAMP",
            "charts": [
                {
                    "type": "line",
                    "y": "activeSessionCount",
                    "fill": "#1aa3ff"
                }
                ,
                {
                    "type": "line",
                    "y": "newSessionCount",
                    "fill": "#ff7f0e"
                },
                {
                    "type": "line",
                    "y": "terminatedSessionCount",
                    "fill": "#00e600"
                }
            ],
            "maxLength": 60,
             yAxisLabel: 'Session Count',
             xAxisLabel: 'Time',
            legend: true,
             append: false
        };

        this.metadata = {
               names: ['AGG_TIMESTAMP', 'activeSessionCount', 'newSessionCount', 'terminatedSessionCount'],
               types: ['time', 'linear', 'linear', 'linear']
             // names: ['AGG_TIMESTAMP', 'activeSessionCount'],
              //types: ['time', 'linear']

        };

        this.state ={
            aggregateData: [],
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

    _handleDataReceived(setData){
       // console.log("Handling received Data\n", message);
        let {metadata, data} = setData;
        metadata.types[0] = 'TIME';
        this.setState({
            metadata: metadata,
            aggregateData: data,
        });

        console.log("Handled data successfully");
    }

    setReceivedMsg(receivedMsg){
    console.log("Received data successfully");
        this.setState({
           per: receivedMsg.granularity,
            fromDate: receivedMsg.from,
            toDate: receivedMsg.to,
            successData: [],
            failureData: []
        }, this.assembleQuery);

    }

    assembleQuery(){
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        let dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.query;
        query = query
            .replace("{{per}}", this.state.per)
            .replace("{{from}}", this.state.fromDate)
            .replace("{{to}}", this.state.toDate);
        dataProviderConfigs.configs.config.queryData.query = query;


        super.getWidgetChannelManager()
            .subscribeWidget(this.props.id, this._handleDataReceived, dataProviderConfigs);
    }
    render(){
    console.log("In render\n");
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <section style={{paddingTop: 50}}>
                    <VizG
                        config={this.ChartConfig}
                        metadata={this.state.metadata}
                        data={this.state.aggregateData}
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
global.dashboard.registerWidget("ISLineChart", ISLineChart);