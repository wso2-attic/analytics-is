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
import java.util.Random;


public class ISSessionAnalyticsTestCase extends DASIntegrationTest {

    private static final Log log = LogFactory.getLog(ISSessionAnalyticsTestCase.class);
    private static final String ANALYTICS_SERVICE_NAME = "AnalyticsProcessorAdminService";
    private DataPublisherClient dataPublisherClient;
    private ServerConfigurationManager serverManager;
    private AnalyticsDataAPI analyticsDataAPI;
    private AnalyticsProcessorAdminServiceStub analyticsStub;
    private String streamId = "org.wso2.is.analytics.stream.OverallSession:1.0.0";
    private static int count = 11;
    private static int sessionStart = 1;
    private static final Random RAND = new Random();


    private static final String[] USERS = {"Inosh", "Malith", "Niranda", "Gimantha",
                                           "Gokul", "Maninda", "Anjana", "Gihan", "Dunith", "Sachith"};

    private static final String[] TENANT_DOMAIN = {"inosh.com", "malith.com", "niranda.com",
                                                   "gimantha.com", "gokul.com", "maninda.com", "anjana.com", "gihan.com", "dunith.com", "sachith.com"};

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
        dataPublisherClient = new DataPublisherClient("tcp://localhost:9411");
        String apiConf = new File(analyticsDataConfigLocation).getAbsolutePath();
        analyticsDataAPI = new CarbonAnalyticsAPI(apiConf);
        initAnalyticsProcessorStub();
    }


    //==========================  Overall Auth Success and Failure Count  =======================================================================

    @Test(groups = "wso2.analytics.is", description = "Publishing sample events to DAS4is")
    public void publishData() throws Exception {

        serverManager = new ServerConfigurationManager(dasServer);
        int ctr = 0;
        int totalEvents = sessionStart + count;
        for (int i = sessionStart; sessionStart <= totalEvents; sessionStart++) {
            long currentTime = System.currentTimeMillis();
            int idx = RAND.nextInt(10);
            Object[] payload = new Object[]{
                    sessionStart + "",
                    currentTime,
                    currentTime,
                    currentTime + RAND.nextInt(1000 * 10),
                    1,
                    USERS[idx],
                    USERS[idx],
                    "127.0.0.1",
                    "NOT_AVAILABLE",
                    TENANT_DOMAIN[idx],
                    "travelocity.com",
                    "Google",
                    RAND.nextBoolean(),
                    "Firefox",
                    System.currentTimeMillis()
            };
            Event event = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null, payload);
            dataPublisherClient.publish(event);
            ctr++;
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                System.out.println(e);
            }
            System.out.println("Published " + ctr + " events.");
        }

        Thread.sleep(5000);
        dataPublisherClient.shutdown();
        Thread.sleep(20000);
        analyticsStub.executeScriptInBackground("IsAnalytics-SparkScript-SessionData");
        Thread.sleep(15000);
        analyticsStub.executeScriptInBackground("IsAnalytics-SparkScript-SessionManagement");
        Thread.sleep(15000);
        analyticsStub.executeScriptInBackground("IsAnalytics-SparkScript-SessionData");
        Thread.sleep(15000);


    }

    @Test(groups = "wso2.analytics.is", description = "Check Total session Event Count", dependsOnMethods = "publishData")
    public void retrieveTableCountTest() throws AnalyticsServiceException, AnalyticsException {
        long eventCount = analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, "ORG_WSO2_IS_ANALYTICS_STREAM_SESSIONINFO", Long.MIN_VALUE, Long.MAX_VALUE);
        Assert.assertEquals(eventCount, 12, "========== Total session event count is invalid ================");
    }

//
//    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Day for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
//    public void retrieveAuthSuccessFailureCountFromPerDayForUserTest()
//            throws AnalyticsServiceException, AnalyticsException, RemoteException,
//                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {
//
//        List<AggregateField> fields = new ArrayList<AggregateField>();
//        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
//        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
//        AggregateRequest aggregateRequest = new AggregateRequest();
//        aggregateRequest.setFields(fields);
//        aggregateRequest.setAggregateLevel(0);
//        aggregateRequest.setParentPath(new ArrayList<String>());
//        aggregateRequest.setGroupByField("facetStartTime");
//        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND identityProviderType:\"FEDERATED\" AND userName:\"Sarah\"");
//        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
//        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);
//
//        double totalSuccessCount = 0;
//        double totalFailureCount = 0;
//
//        while (resultItr.hasNext()) {
//            Record record = resultItr.next();
//            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
//            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
//        }
//
//        Assert.assertEquals((totalSuccessCount + totalFailureCount), 1290.0, "========== Total auth success and failure event count are invalid per-day for user table ================");
//    }
//
//    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Month for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
//    public void retrieveAuthSuccessFailureCountFromPerMonthForUserTest()
//            throws AnalyticsServiceException, AnalyticsException, RemoteException,
//                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {
//
//        List<AggregateField> fields = new ArrayList<AggregateField>();
//        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
//        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
//        AggregateRequest aggregateRequest = new AggregateRequest();
//        aggregateRequest.setFields(fields);
//        aggregateRequest.setAggregateLevel(0);
//        aggregateRequest.setParentPath(new ArrayList<String>());
//        aggregateRequest.setGroupByField("facetStartTime");
//        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND identityProviderType:\"FEDERATED\" AND userName:\"Sarah\"");
//        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
//        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);
//
//        double totalSuccessCount = 0;
//        double totalFailureCount = 0;
//
//        while (resultItr.hasNext()) {
//            Record record = resultItr.next();
//            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
//            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
//        }
//
//        Assert.assertEquals((totalSuccessCount + totalFailureCount), 1290.0, "========== Total auth success and failure event count are invalid per-month for user table ================");
//    }
//
//        public static void main(String[] args) throws AnalyticsException, InterruptedException {
//
//        String analyticsDataConfigLocation = "/home/mohan/wso2/source-code/public/git/analytics-is/product/integration/tests-integration/tests/src/test/resources/config/analytics-data-config.xml";
//        String apiConf = new File(analyticsDataConfigLocation).getAbsolutePath();
//        AnalyticsDataAPI analyticsDataAPI = new CarbonAnalyticsAPI(apiConf);
////        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);
//
//        long eventCount = analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, "ORG_WSO2_IS_ANALYTICS_STREAM_SESSIONINFO", Long.MIN_VALUE, Long.MAX_VALUE);
//            System.out.println(eventCount);
//    }



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


}
