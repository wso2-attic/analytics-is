/*
* Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
* WSO2 Inc. licenses this file to you under the Apache License,
* Version 2.0 (the "License"); you may not use this file except
* in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

package org.wso2.das4is.integration.tests.is;

import org.apache.axis2.client.Options;
import org.apache.axis2.client.ServiceClient;
import org.apache.axis2.context.ConfigurationContext;
import org.apache.axis2.context.ConfigurationContextFactory;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.analytics.api.AnalyticsDataAPI;
import org.wso2.carbon.analytics.api.CarbonAnalyticsAPI;
import org.wso2.carbon.analytics.api.exception.AnalyticsServiceException;
import org.wso2.carbon.analytics.dataservice.commons.AggregateField;
import org.wso2.carbon.analytics.dataservice.commons.AggregateRequest;
import org.wso2.carbon.analytics.datasource.commons.AnalyticsIterator;
import org.wso2.carbon.analytics.datasource.commons.Record;
import org.wso2.carbon.analytics.datasource.commons.exception.AnalyticsException;
import org.wso2.carbon.analytics.spark.admin.stub.AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException;
import org.wso2.carbon.analytics.spark.admin.stub.AnalyticsProcessorAdminServiceStub;
import org.wso2.carbon.automation.engine.frameworkutils.FrameworkPathUtil;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.integration.common.utils.mgt.ServerConfigurationManager;
import org.wso2.carbon.utils.multitenancy.MultitenantConstants;
import org.wso2.das.integration.common.utils.DASIntegrationTest;
import org.wso2.das4is.integration.common.clients.DataPublisherClient;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.List;


public class ISAnalyticsTestCase extends DASIntegrationTest {

    private static final Log log = LogFactory.getLog(ISAnalyticsTestCase.class);
    private DataPublisherClient dataPublisherClient;
    private ServerConfigurationManager serverManager;
    private AnalyticsDataAPI analyticsDataAPI;
    private static final String ANALYTICS_SERVICE_NAME = "AnalyticsProcessorAdminService";
    private String sampleCSVDataFileName = "yearAuthDataV10-no-duplicate.csv";
    private String streamId = "authentication-analytics-stream:1.0.0";
    private AnalyticsProcessorAdminServiceStub analyticsStub;

    @BeforeClass(alwaysRun = true)
    protected void init() throws Exception {
        super.init();
        String rdbmsConfigArtifactLocation = FrameworkPathUtil.getSystemResourceLocation() + File.separator + "config" +
                                             File.separator + "rdbms-config.xml";
        String rdbmsConfigLocation = FrameworkPathUtil.getCarbonHome() + File.separator + "repository" + File.separator + "conf" + File
                .separator + "analytics" + File.separator + "rdbms-config.xml";
        String analyticsDataConfigLocation = FrameworkPathUtil.getSystemResourceLocation() + File.separator + "config" +
                                             File.separator + "analytics-data-config.xml";

        serverManager = new ServerConfigurationManager(dasServer);
        File sourceFile = new File(rdbmsConfigArtifactLocation);
        File targetFile = new File(rdbmsConfigLocation);
        serverManager.applyConfigurationWithoutRestart(sourceFile, targetFile, true);
        serverManager.restartGracefully();
        Thread.sleep(150000);
        String session = getSessionCookie();
        dataPublisherClient = new DataPublisherClient("tcp://localhost:8311");
        String apiConf = new File(analyticsDataConfigLocation).getAbsolutePath();
        analyticsDataAPI = new CarbonAnalyticsAPI(apiConf);
        initAnalyticsProcessorStub();
    }

    @Test(groups = "wso2.analytics.is", description = "Publishing sample events to DAS4is")
    public void publishData() throws Exception {

        serverManager = new ServerConfigurationManager(dasServer);
        String sampleDataFilePath = FrameworkPathUtil.getSystemResourceLocation() +
                                    "sampleData" + File.separator;

        try {
            BufferedReader br = new BufferedReader(new FileReader(sampleDataFilePath + sampleCSVDataFileName), 10 * 1024 * 1024);

            long count = 0;
            String line = br.readLine();
            long start = System.currentTimeMillis();
            List<Event> sampleEventList = new ArrayList<>();
            while (line != null) {
                String[] eventObject = line.split(",");
                line = br.readLine();
                Object[] payload = new Object[]{eventObject[0], eventObject[1], Boolean.valueOf(eventObject[2]), eventObject[3], eventObject[4], eventObject[5],
                                                eventObject[6], eventObject[7], eventObject[8], Boolean.valueOf(eventObject[9]),
                                                Boolean.valueOf(eventObject[10]), Boolean.valueOf(eventObject[11]), eventObject[12], eventObject[13], eventObject[14],
                                                Boolean.valueOf(eventObject[15]), eventObject[16], Boolean.valueOf(eventObject[17]), Boolean.valueOf(eventObject[18]),
                                                Long.valueOf(eventObject[19])};

                count++;

                Event event = new Event(streamId, System.currentTimeMillis(), null, null, payload);
                sampleEventList.add(event);
            }
            dataPublisherClient.publish(sampleEventList);
            Thread.sleep(10000);
            dataPublisherClient.shutdown();
            Thread.sleep(10000);

        } catch (Throwable e) {
            log.error("Error when publishing sample authentication events", e);
        }

        System.out.println("TEST");

    }

    @Test(groups = "wso2.analytics.is", description = "Check Total Event Count", dependsOnMethods = "publishData")
    public void retrieveTableCountTest() throws AnalyticsServiceException, AnalyticsException {
        long eventCount = analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, "AUTHENTICATION-ANALYTICS-STREAM", Long.MIN_VALUE, Long.MAX_VALUE);
        Assert.assertEquals(eventCount, 14549, "========== Total authentication event count is invalid ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Min", dependsOnMethods = "retrieveTableCountTest")
    public void retrieveAuthSuccessFailureCountFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, InterruptedException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException {

        Thread.sleep(25000);
        analyticsStub.executeScriptInBackground("is_stat_analytics");
        List<AggregateField> fields = new ArrayList<AggregateField>();
        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
        AggregateRequest aggregateRequest = new AggregateRequest();
        aggregateRequest.setFields(fields);
        aggregateRequest.setAggregateLevel(0);
        aggregateRequest.setParentPath(new ArrayList<String>());
        aggregateRequest.setGroupByField("facetStartTime");
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\"");
        aggregateRequest.setTableName("IS-AUTHENTICATION-STAT-PER-MINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount = totalSuccessCount + ((Double) record.getValues().get("total_authSuccessCount"));
            totalFailureCount = totalFailureCount + ((Double) record.getValues().get("total_authFailureCount"));
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0 , "========== Total auth success and failure event count are invalid in per-minute table ================");
    }


    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Hour", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerMinTest")
    public void retrieveAuthSuccessFailureCountFromPerHourTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        Thread.sleep(120000);

        List<AggregateField> fields = new ArrayList<AggregateField>();
        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
        AggregateRequest aggregateRequest = new AggregateRequest();
        aggregateRequest.setFields(fields);
        aggregateRequest.setAggregateLevel(0);
        aggregateRequest.setParentPath(new ArrayList<String>());
        aggregateRequest.setGroupByField("facetStartTime");
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\"");
        aggregateRequest.setTableName("IS-AUTHENTICATION-STAT-PER-HOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0 , "========== Total auth success and failure event count are invalid per-hour table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Day", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerDayTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        List<AggregateField> fields = new ArrayList<AggregateField>();
        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
        AggregateRequest aggregateRequest = new AggregateRequest();
        aggregateRequest.setFields(fields);
        aggregateRequest.setAggregateLevel(0);
        aggregateRequest.setParentPath(new ArrayList<String>());
        aggregateRequest.setGroupByField("facetStartTime");
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\"");
        aggregateRequest.setTableName("IS-AUTHENTICATION-STAT-PER-DAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0 , "========== Total auth success and failure event count are invalid per-day table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerDayTest")
    public void retrieveAuthSuccessFailureCountFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        List<AggregateField> fields = new ArrayList<AggregateField>();
        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
        AggregateRequest aggregateRequest = new AggregateRequest();
        aggregateRequest.setFields(fields);
        aggregateRequest.setAggregateLevel(0);
        aggregateRequest.setParentPath(new ArrayList<String>());
        aggregateRequest.setGroupByField("facetStartTime");
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\"");
        aggregateRequest.setTableName("IS-AUTHENTICATION-STAT-PER-MONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0 , "========== Total auth success and failure event count are invalid per-month table ================");
    }


    @AfterTest(alwaysRun = true)
    public void startRestoreAnalyticsConfigFile() throws Exception {
        serverManager.restoreToLastConfiguration();
        serverManager.restartGracefully();
    }


    private void initAnalyticsProcessorStub() throws Exception {
        ConfigurationContext configContext = ConfigurationContextFactory.
                createConfigurationContextFromFileSystem(null);
        String loggedInSessionCookie = getSessionCookie();
        analyticsStub = new AnalyticsProcessorAdminServiceStub(configContext,
                                                               backendURL + "/services/" + ANALYTICS_SERVICE_NAME);
        ServiceClient client = analyticsStub._getServiceClient();
        Options option = client.getOptions();
        option.setManageSession(true);
        option.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING,
                           loggedInSessionCookie);
    }

//
//    public static void main(String[] args) throws AnalyticsException, InterruptedException {
//        List<AggregateField> fields = new ArrayList<AggregateField>();
//        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
//        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
//        AggregateRequest aggregateRequest = new AggregateRequest();
//        aggregateRequest.setFields(fields);
//        aggregateRequest.setAggregateLevel(0);
//        aggregateRequest.setParentPath(new ArrayList<String>());
//        aggregateRequest.setGroupByField("facetStartTime");
//        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\"");
//        aggregateRequest.setTableName("IS-AUTHENTICATION-STAT-PER-MINUTE");
//        String analyticsDataConfigLocation = "/home/mohan/wso2/source-code/public/git/analytics-is/product/integration/tests-integration/tests/src/test/resources/config/analytics-data-config.xml";
//        String apiConf = new File(analyticsDataConfigLocation).getAbsolutePath();
//        AnalyticsDataAPI analyticsDataAPI =  new CarbonAnalyticsAPI(apiConf);
//        AnalyticsIterator<Record> resultItr = analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);
//
//        double totalSuccessCount = 0;
//        double totalFailureCount = 0;
//
//        Thread.sleep(10000);
//
//        while (resultItr.hasNext()) {
//            Record record = resultItr.next();
//            totalSuccessCount = totalSuccessCount + ((Double) record.getValues().get("total_authSuccessCount"));
//            totalFailureCount = totalFailureCount + ((Double) record.getValues().get("total_authFailureCount"));
//        }
//
//        System.out.println(totalFailureCount);
//    }


}
