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
import org.wso2.carbon.analytics.dataservice.commons.CategoryDrillDownRequest;
import org.wso2.carbon.analytics.dataservice.commons.CategorySearchResultEntry;
import org.wso2.carbon.analytics.dataservice.commons.SubCategories;
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
    private static final String ANALYTICS_SERVICE_NAME = "AnalyticsProcessorAdminService";
    private DataPublisherClient dataPublisherClient;
    private ServerConfigurationManager serverManager;
    private AnalyticsDataAPI analyticsDataAPI;
    private String sampleCSVDataFileName = "yearAuthDataV10-no-duplicate.csv";
    private String streamId = "org.wso2.is.analytics.stream.OverallAuthentication:1.0.0";
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
        dataPublisherClient = new DataPublisherClient("tcp://localhost:8311");
        String apiConf = new File(analyticsDataConfigLocation).getAbsolutePath();
        analyticsDataAPI = new CarbonAnalyticsAPI(apiConf);
        initAnalyticsProcessorStub();
    }


    //==========================  Overall Auth Success and Failure Count  =======================================================================

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
        long eventCount = analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, "ORG_WSO2_IS_ANALYTICS_STREAM_OVERALLAUTHENTICATION", Long.MIN_VALUE, Long.MAX_VALUE);
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
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount = totalSuccessCount + ((Double) record.getValues().get("total_authSuccessCount"));
            totalFailureCount = totalFailureCount + ((Double) record.getValues().get("total_authFailureCount"));
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0, "========== Total auth success and failure event count are invalid in per-minute table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Hour", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerMinTest")
    public void retrieveAuthSuccessFailureCountFromPerHourTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        Thread.sleep(180000);

        List<AggregateField> fields = new ArrayList<AggregateField>();
        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
        AggregateRequest aggregateRequest = new AggregateRequest();
        aggregateRequest.setFields(fields);
        aggregateRequest.setAggregateLevel(0);
        aggregateRequest.setParentPath(new ArrayList<String>());
        aggregateRequest.setGroupByField("facetStartTime");
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0, "========== Total auth success and failure event count are invalid per-hour table ================");
    }


    //==========================  Overall Auth Success and Failure Count - For User ==============================================

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
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0, "========== Total auth success and failure event count are invalid per-day table ================");
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
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 11176.0, "========== Total auth success and failure event count are invalid per-month table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Min for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerMinForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND userName:\"Sarah\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 1290.0, "========== Total auth success and failure event count are invalid per-min for user table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Hour for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerHourForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND userName:\"Sarah\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 1290.0, "========== Total auth success and failure event count are invalid per-hour for user table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Day for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerDayForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND userName:\"Sarah\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 1290.0, "========== Total auth success and failure event count are invalid per-day for user table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Month for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerMonthForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND userName:\"Sarah\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 1290.0, "========== Total auth success and failure event count are invalid per-month for user table ================");
    }



    //================================= Get max succeeded auth users =========================================================================

    @Test(groups = "wso2.analytics.is", description = "Check max succeeded auth users - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveMaxAuthSuccessUsersFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Sarah", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 971.0, "======= Invalid score received for user Sarah ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Gary", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 949.0, "======= Invalid score received for user Gary ==== ");
                } else if (i == 2) {
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getCategoryValue(), "Victor", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 541.0, "======= Invalid score received for user Victor ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Laila", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 515.0, "======= Invalid score received for user Laila ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "David", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 500.0, "======= Invalid score received for user David ==== ");
                } else if (i == 5) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Jessica") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Felix")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 499.0, "======= Invalid score received for user Jessica ==== ");
                } else if (i == 6) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Jessica") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Felix")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 499.0, "======= Invalid score received for user Felix ==== ");
                } else if (i == 7) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Isabelle") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Elizabeth")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 493.0, "======= Invalid score received for user Isabelle ==== ");
                } else if (i == 8) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Isabelle") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Elizabeth")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 493.0, "======= Invalid score received for user Elizabeth ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Celine", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 492.0, "======= Invalid score received for user Celine ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check max succeeded auth users - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveMaxAuthSuccessUsersFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Sarah", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 971.0, "======= Invalid score received for user Sarah ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Gary", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 949.0, "======= Invalid score received for user Gary ==== ");
                } else if (i == 2) {
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getCategoryValue(), "Victor", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 541.0, "======= Invalid score received for user Victor ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Laila", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 515.0, "======= Invalid score received for user Laila ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "David", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 500.0, "======= Invalid score received for user David ==== ");
                } else if (i == 5) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Jessica") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Felix")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 499.0, "======= Invalid score received for user Jessica ==== ");
                } else if (i == 6) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Jessica") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Felix")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 499.0, "======= Invalid score received for user Felix ==== ");
                } else if (i == 7) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Isabelle") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Elizabeth")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 493.0, "======= Invalid score received for user Isabelle ==== ");
                } else if (i == 8) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Isabelle") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Elizabeth")), "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 493.0, "======= Invalid score received for user Elizabeth ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Celine", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 492.0, "======= Invalid score received for user Celine ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received ============================");
        }
    }



    //================================= Get max failed auth users =========================================================================

    @Test(groups = "wso2.analytics.is", description = "Check max failed auth users - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveMaxAuthFailureUsersFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Sarah", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 319.0, "======= Invalid score received for user Sarah ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Gary", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 293.0, "======= Invalid score received for user Gary ==== ");
                } else if (i == 2) {
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getCategoryValue(), "David", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 185.0, "======= Invalid score received for user David ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Elizabeth", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 184.0, "======= Invalid score received for user Elizabeth ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Victor", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 183.0, "======= Invalid score received for user Victor ==== ");
                } else if (i == 5) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Isabelle", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 180.0, "======= Invalid score received for user Isabelle ==== ");
                } else if (i == 6) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Felix", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 173.0, "======= Invalid score received for user Felix ==== ");
                } else if (i == 7) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(),"Adam", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 170.0, "======= Invalid score received for user Adam ==== ");
                } else if (i == 8) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(),"John" , "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 168.0, "======= Invalid score received for user John ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Celine", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 166.0, "======= Invalid score received for user Celine ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received ============================");
        }
    }


    @Test(groups = "wso2.analytics.is", description = "Check max failed auth users - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveMaxAuthFailureUsersFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Sarah", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 319.0, "======= Invalid score received for user Sarah ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Gary", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 293.0, "======= Invalid score received for user Gary ==== ");
                } else if (i == 2) {
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getCategoryValue(), "David", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 185.0, "======= Invalid score received for user David ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Elizabeth", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 184.0, "======= Invalid score received for user Elizabeth ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Victor", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 183.0, "======= Invalid score received for user Victor ==== ");
                } else if (i == 5) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Isabelle", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 180.0, "======= Invalid score received for user Isabelle ==== ");
                } else if (i == 6) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Felix", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 173.0, "======= Invalid score received for user Felix ==== ");
                } else if (i == 7) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(),"Adam", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 170.0, "======= Invalid score received for user Adam ==== ");
                } else if (i == 8) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(),"John" , "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 168.0, "======= Invalid score received for user John ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Celine", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 166.0, "======= Invalid score received for user Celine ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received ============================");
        }
    }


    //==========================  Overall Auth Success and Failure Count - For Service Provider ==============================================

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Min for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerMinForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 2060.0, "========== Total auth success and failure event count are invalid per-min for service provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Hour for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerHourForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 2060.0, "========== Total auth success and failure event count are invalid per-hour for service provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Day for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerDayForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 2060.0, "========== Total auth success and failure event count are invalid per-day for service provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Month for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerMonthForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 2060.0, "========== Total auth success and failure event count are invalid per-month for service provider table ================");
    }

    //==========================  Overall Auth Success and Failure Count - For Identity Provider ==============================================

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Min for Identity Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerMinForIDPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND identityProvider:\"Google\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 5011.0, "========== Total auth success and failure event count are invalid per-min for identity provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Hour for Identity Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerHourForIDPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND identityProvider:\"Google\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 5011.0, "========== Total auth success and failure event count are invalid per-hour for identity provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Day for Identity Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerDayForIDPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND identityProvider:\"Google\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 5011.0, "========== Total auth success and failure event count are invalid per-day for identity provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check Auth success and failure count - Per Month for Identity Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveAuthSuccessFailureCountFromPerMonthForIDPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"true\" AND identityProvider:\"Google\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 5011.0, "========== Total auth success and failure event count are invalid per-month for identity provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check max succeeded identity providers - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveMaxAuthSuccessIdentityProvidersFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_IDPAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("identityProvider");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 4) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 4; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Google", "======= Invalid identity provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 3768.0, "======= Invalid score received for identity provider Google ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "WSO2IS", "======= Invalid identity provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 1550.0, "======= Invalid score received for identity provider WSO2IS ==== ");
                } else if (i == 2) {
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getCategoryValue(), "Yahoo", "======= Invalid identity provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 1540.0, "======= Invalid score received for identity provider Yahoo ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Facebook", "======= Invalid identity provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 1523.0, "======= Invalid score received for identity provider Facebook ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of identity providers received ============================");
        }
    }

    //================================= Get max service provider first login =================================================================================

    @Test(groups = "wso2.analytics.is", description = "Check max service provider first login - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveMaxServiceProviderFirstLoginFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
                   AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_SPAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("serviceprovider");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
        categoryDrillDownRequest.setScoreFunction("authFirstSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Booking", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 1561.0, "======= Invalid score received for service provider Booking ==== ");
                } else if (i == 1) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Lonely Planet") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Yahoo Travel")), "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 790.0, "======= Invalid score received for service provider Lonely Planet or Yahoo Travels ==== ");
                } else if (i == 2) {
                    Assert.assertTrue(((categorySearchResultEntryArray[i]).getCategoryValue().equals("Lonely Planet") || (categorySearchResultEntryArray[i]).getCategoryValue().equals("Yahoo Travel")), "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 790.0, "======= Invalid score received for service provider Lonely Planet or Yahoo Travels ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Trip Advisor", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 788.0, "======= Invalid score received for service provider Trip Advisor ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "JIRA", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 773.0, "======= Invalid score received for service provider JIRA ==== ");
                } else if (i == 5) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Hotels", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 744.0, "======= Invalid score received for service provider Hotels ==== ");
                } else if (i == 6) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Priceline", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 743.0, "======= Invalid score received for service provider Priceline ==== ");
                } else if (i == 7) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(),"Expedia", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 733.0, "======= Invalid score received for service provider Expedia ==== ");
                } else if (i == 8) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(),"AirBnB" , "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 731.0, "======= Invalid score received for service provider AirBnB ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Travelocity", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 728.0, "======= Invalid score received for service provider Travelocity ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received ============================");
        }
    }

    // ============================================ Resident IDP - Overall auth success and failure count ================================

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Min", dependsOnMethods = "retrieveTableCountTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, InterruptedException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException {

        Thread.sleep(25000);
        List<AggregateField> fields = new ArrayList<AggregateField>();
        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
        AggregateRequest aggregateRequest = new AggregateRequest();
        aggregateRequest.setFields(fields);
        aggregateRequest.setAggregateLevel(0);
        aggregateRequest.setParentPath(new ArrayList<String>());
        aggregateRequest.setGroupByField("facetStartTime");
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount = totalSuccessCount + ((Double) record.getValues().get("total_authSuccessCount"));
            totalFailureCount = totalFailureCount + ((Double) record.getValues().get("total_authFailureCount"));
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Total auth success and failure event count for resident IDP are invalid in per-minute table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Hour", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerMinTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerHourTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        Thread.sleep(180000);
        List<AggregateField> fields = new ArrayList<AggregateField>();
        fields.add(new AggregateField(new String[]{"authSuccessCount"}, "SUM", "total_authSuccessCount"));
        fields.add(new AggregateField(new String[]{"authFailureCount"}, "SUM", "total_authFailureCount"));
        AggregateRequest aggregateRequest = new AggregateRequest();
        aggregateRequest.setFields(fields);
        aggregateRequest.setAggregateLevel(0);
        aggregateRequest.setParentPath(new ArrayList<String>());
        aggregateRequest.setGroupByField("facetStartTime");
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Total auth success and failure event count for resident IDP are invalid per-hour table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Day", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerDayTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Total auth success and failure event count for resident IDP are invalid per-day table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerDayTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMonthTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Total auth success and failure event count for resident IDP are invalid per-month table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Min for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMinForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userName:\"Rachel\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 632.0, "========== Total auth success and failure event count for resident IDP are invalid per-min for user table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Hour for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerHourForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userName:\"Rachel\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 632.0, "========== Total auth success and failure event count for resident IDP are invalid per-hour for user table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Day for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerDayForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userName:\"Rachel\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 632.0, "========== Total auth success and failure event count for resident IDP are invalid per-day for user table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Month for User", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMonthForUserTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userName:\"Rachel\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 632.0, "========== Total auth success and failure event count for resident IDP are invalid per-month for user table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max succeeded auth users - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthSuccessUsersFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 5) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 5; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Mary", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 524.0, "======= Invalid score received for user Mary ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Harry", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 522.0, "======= Invalid score received for user Harry ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Tom", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 512.0, "======= Invalid score received for user Tom ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Peter", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 496.0, "======= Invalid score received for user Peter ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Rachel", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 463.0, "======= Invalid score received for user Rachel ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max succeeded auth users - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthSuccessUsersFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 5) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 5; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Mary", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 524.0, "======= Invalid score received for user Mary ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Harry", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 522.0, "======= Invalid score received for user Harry ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Tom", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 512.0, "======= Invalid score received for user Tom ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Peter", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 496.0, "======= Invalid score received for user Peter ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Rachel", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 463.0, "======= Invalid score received for user Rachel ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received for resident IDP ============================");
        }
    }



    //================================= Get max failed auth users =========================================================================

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max failed auth users - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthFailureUsersFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 5) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 5; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Tom", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 180.0, "======= Invalid score received for user Tom ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Harry", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 178.0, "======= Invalid score received for user Harry ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Peter", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 171.0, "======= Invalid score received for user Peter ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Rachel", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 169.0, "======= Invalid score received for user Rachel ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Mary", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 158.0, "======= Invalid score received for user Mary ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received for resident IDP ============================");
        }
    }


    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max failed auth users - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthFailureUsersFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("userName");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 5) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 5; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Tom", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 180.0, "======= Invalid score received for user Tom ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Harry", "======= Invalid user name received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 178.0, "======= Invalid score received for user Harry ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Peter", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 171.0, "======= Invalid score received for user Peter ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Rachel", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 169.0, "======= Invalid score received for user Rachel ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Mary", "======= Invalid user name received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 158.0, "======= Invalid score received for user Mary ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of users received for resident IDP ============================");
        }
    }

    //==========================  Resident IDP Overall Auth Success and Failure Count - For Role ==============================================

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Min for Role", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMinForRoleTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND role:\"Admin\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_ROLEAUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 681.0, "========== Resident IDP total auth success and failure event count are invalid per-min for role table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Hour for Role", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerHourForRoleTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND role:\"Admin\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_ROLEAUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 681.0, "========== Resident IDP total auth success and failure event count are invalid per-hour for role table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Day for Role", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerDayForRoleTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND role:\"Admin\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_ROLEAUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 681.0, "========== Resident IDP total auth success and failure event count are invalid per-day for role table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Month for Role", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMonthForRoleTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND role:\"Admin\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_ROLEAUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 681.0, "========== Resident IDP total auth success and failure event count are invalid per-month for role table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check max succeeded roles - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthSuccessRolesFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_ROLEAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("role");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 7) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 7; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Developer", "======= Invalid role received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 2961.0, "======= Invalid score received for role Developer ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Manager", "======= Invalid role received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 2001.0, "======= Invalid score received for role Manager ==== ");
                } else if (i == 2) {
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getCategoryValue(), "Architect", "======= Invalid role received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 984.0, "======= Invalid score received for role Architect ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Super User", "======= Invalid role received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 970.0, "======= Invalid score received for role Super User ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Admin", "======= Invalid role received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 499.0, "======= Invalid score received for role Super Admin ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of roles received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Min for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMinForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 658.0, "========== Resident IDP - total auth success and failure event count are invalid per-min for service provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Hour for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerHourForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 658.0, "========== Resident IDP - total auth success and failure event count are invalid per-hour for service provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Day for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerDayForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 658.0, "========== Resident IDP total auth success and failure event count are invalid per-day for service provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Month for Service Provider", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMonthForSPTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND serviceprovider:\"Booking\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 658.0, "========== Resident IDP total auth success and failure event count are invalid per-month for service provider table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max succeeded auth service providers - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthSuccessServiceProvidersFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_SPAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("serviceprovider");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Booking", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 496.0, "======= Invalid score received for service provider Booking ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Yahoo Travel", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 241.0, "======= Invalid score received for service provider Yahoo Travel ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "JIRA", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 234.0, "======= Invalid score received for service provider JIRA ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Lonely Planet", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 233.0, "======= Invalid score received for service provider Lonely Planet ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Expedia", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 229.0, "======= Invalid score received for service provider Expedia ==== ");
                } else if (i == 5) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Priceline", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 227.0, "======= Invalid score received for service provider Priceline ==== ");
                } else if (i == 6) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Trip Advisor", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 226.0, "======= Invalid score received for service provider Trip Advisor ==== ");
                } else if (i == 7) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "AirBnB", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 222.0, "======= Invalid score received for service provider AirBnB ==== ");
                } else if (i == 8) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Travelocity", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 212.0, "======= Invalid score received for service provider Travelocity ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Hotels", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 197.0, "======= Invalid score received for service provider Hotels ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of service providers received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max succeeded auth service providers - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthSuccessServiceProvidersFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_SPAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("serviceprovider");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Booking", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 496.0, "======= Invalid score received for service provider Booking ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Yahoo Travel", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 241.0, "======= Invalid score received for service provider Yahoo Travel ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "JIRA", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 234.0, "======= Invalid score received for service provider JIRA ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Lonely Planet", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 233.0, "======= Invalid score received for service provider Lonely Planet ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Expedia", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 229.0, "======= Invalid score received for service provider Expedia ==== ");
                } else if (i == 5) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Priceline", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 227.0, "======= Invalid score received for service provider Priceline ==== ");
                } else if (i == 6) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Trip Advisor", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 226.0, "======= Invalid score received for service provider Trip Advisor ==== ");
                } else if (i == 7) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "AirBnB", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 222.0, "======= Invalid score received for service provider AirBnB ==== ");
                } else if (i == 8) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Travelocity", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 212.0, "======= Invalid score received for service provider Travelocity ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Hotels", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 197.0, "======= Invalid score received for service provider Hotels ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of service providers received for resident IDP ============================");
        }
    }

    //================================= Get max failed auth service providers for resident IDP =========================================================================

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max failed auth service providers - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthFailureServiceProvidersFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_SPAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("serviceprovider");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Booking", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 162.0, "======= Invalid score received for service provider Booking ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Priceline", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 92.0, "======= Invalid score received for service provider Priceline ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Expedia", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 89.0, "======= Invalid score received for service provider Expedia ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Hotels", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 80.0, "======= Invalid score received for service provider Hotels ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Lonely Planet", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 78.0, "======= Invalid score received for service provider Lonely Planet ==== ");
                } else if (i == 5) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Yahoo Travel", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 73.0, "======= Invalid score received for service provider Yahoo Travel ==== ");
                } else if (i == 6) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "AirBnB", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 72.0, "======= Invalid score received for service provider AirBnB ==== ");
                } else if (i == 7) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Trip Advisor", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 71.0, "======= Invalid score received for service provider Trip Advisor ==== ");
                } else if (i == 8) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Travelocity", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 70.0, "======= Invalid score received for service provider Travelocity ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "JIRA", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 69.0, "======= Invalid score received for service provider JIRA ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of service providers received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max failed auth service providers - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthFailureServiceProvidersFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_SPAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("serviceprovider");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 10) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            for (int i = 0; i < 10; i++) {
                if (i == 0) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Booking", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 162.0, "======= Invalid score received for service provider Booking ==== ");
                } else if (i == 1) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Priceline", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 92.0, "======= Invalid score received for service provider Priceline ==== ");
                } else if (i == 2) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Expedia", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 89.0, "======= Invalid score received for service provider Expedia ==== ");
                } else if (i == 3) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Hotels", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 80.0, "======= Invalid score received for service provider Hotels ==== ");
                } else if (i == 4) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Lonely Planet", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 78.0, "======= Invalid score received for service provider Lonely Planet ==== ");
                } else if (i == 5) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Yahoo Travel", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 73.0, "======= Invalid score received for service provider Yahoo Travel ==== ");
                } else if (i == 6) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "AirBnB", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 72.0, "======= Invalid score received for service provider AirBnB ==== ");
                } else if (i == 7) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Trip Advisor", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 71.0, "======= Invalid score received for service provider Trip Advisor ==== ");
                } else if (i == 8) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Travelocity", "======= Invalid service provider received ==== ");
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 70.0, "======= Invalid score received for service provider Travelocity ==== ");
                } else if (i == 9) {
                    Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "JIRA", "======= Invalid service provider received ==== ");
                    Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 69.0, "======= Invalid score received for service provider JIRA ==== ");
                }
            }
        } else {
            Assert.fail("================ Invalid no of service providers received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Min for Userstore", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMinForUserstoreTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userStoreDomain:\"wso2\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMINUTE");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Resident IDP - total auth success and failure event count are invalid per-min for userstore table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Hour for Userstore", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerHourForUserstoreTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userStoreDomain:\"wso2\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERHOUR");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Resident IDP - total auth success and failure event count are invalid per-hour for userstore table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Day for Userstore", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerDayForUserstoreTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userStoreDomain:\"wso2\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERDAY");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Resident IDP total auth success and failure event count are invalid per-day for userstore table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP Auth success and failure count - Per Month for Userstore", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPAuthSuccessFailureCountFromPerMonthForUserstoreTest()
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
        aggregateRequest.setQuery("_timestamp : [1339007400000 TO 1465237800000] AND isFederated:\"false\" AND userStoreDomain:\"wso2\"");
        aggregateRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_AUTHSTATPERMONTH");
        AnalyticsIterator<Record> resultItr = this.analyticsDataAPI.searchWithAggregates(-1234, aggregateRequest);

        double totalSuccessCount = 0;
        double totalFailureCount = 0;

        while (resultItr.hasNext()) {
            Record record = resultItr.next();
            totalSuccessCount += (Double) record.getValues().get("total_authSuccessCount");
            totalFailureCount += (Double) record.getValues().get("total_authFailureCount");
        }

        Assert.assertEquals((totalSuccessCount + totalFailureCount), 3373.0, "========== Resident IDP total auth success and failure event count are invalid per-month for userstore table ================");
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max succeeded auth userstores - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthSuccessUserstoresFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERSTOREAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("userStoreDomain");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 1) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            Assert.assertEquals((categorySearchResultEntryArray[0]).getCategoryValue(), "wso2", "======= Invalid userstore received ==== ");
            Assert.assertEquals((categorySearchResultEntryArray[0]).getScore(), 2517.0, "======= Invalid score received for userstore wso2 ==== ");
        } else {
            Assert.fail("================ Invalid no of userstores received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max succeeded auth userstores - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthSuccessUserstoresFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERSTOREAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("userStoreDomain");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authSuccessCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 1) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            Assert.assertEquals((categorySearchResultEntryArray[0]).getCategoryValue(), "wso2", "======= Invalid userstore received ==== ");
            Assert.assertEquals((categorySearchResultEntryArray[0]).getScore(), 2517.0, "======= Invalid score received for userstore wso2 ==== ");
        } else {
            Assert.fail("================ Invalid no of userstores received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max failed auth userstores - Per Min", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthFailureUserstoresFromPerMinTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERSTOREAUTHSTATPERMINUTE");
        categoryDrillDownRequest.setFieldName("userStoreDomain");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 1) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            Assert.assertEquals((categorySearchResultEntryArray[0]).getCategoryValue(), "wso2", "======= Invalid userstore received ==== ");
            Assert.assertEquals((categorySearchResultEntryArray[0]).getScore(), 856.0, "======= Invalid score received for userstore wso2 ==== ");
        } else {
            Assert.fail("================ Invalid no of userstores received for resident IDP ============================");
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check resident IDP max faiiled auth userstores - Per Month", dependsOnMethods = "retrieveAuthSuccessFailureCountFromPerHourTest")
    public void retrieveResidentIDPMaxAuthFailureUserstoresFromPerMonthTest()
            throws AnalyticsServiceException, AnalyticsException, RemoteException,
            AnalyticsProcessorAdminServiceAnalyticsProcessorAdminExceptionException, InterruptedException {

        CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
        categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERSTOREAUTHSTATPERMONTH");
        categoryDrillDownRequest.setFieldName("userStoreDomain");
        categoryDrillDownRequest.setPath(new String[]{});
        categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"false\"");
        categoryDrillDownRequest.setScoreFunction("authFailureCount");
        categoryDrillDownRequest.setStart(0);
        categoryDrillDownRequest.setCount(10);

        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);

        if (subCategories.getCategories().size() == 1) {
            CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
            Assert.assertEquals((categorySearchResultEntryArray[0]).getCategoryValue(), "wso2", "======= Invalid userstore received ==== ");
            Assert.assertEquals((categorySearchResultEntryArray[0]).getScore(), 856.0, "======= Invalid score received for userstore wso2 ==== ");
        } else {
            Assert.fail("================ Invalid no of userstores received for resident IDP ============================");
        }
    }
//        public static void main(String[] args) throws AnalyticsException, InterruptedException {
//
//            CategoryDrillDownRequest categoryDrillDownRequest = new CategoryDrillDownRequest();
//            categoryDrillDownRequest.setTableName("ORG_WSO2_IS_ANALYTICS_STREAM_USERAUTHSTATPERMINUTE");
//            categoryDrillDownRequest.setFieldName("userName");
//            categoryDrillDownRequest.setPath(new String[]{});
//            categoryDrillDownRequest.setQuery("_timestamp : [1339093800000 TO 1465324200000] AND isFederated:\"true\"");
//            categoryDrillDownRequest.setScoreFunction("authSuccessCount");
//            categoryDrillDownRequest.setStart(0);
//            categoryDrillDownRequest.setCount(10);
//
//        String analyticsDataConfigLocation = "/home/mohan/wso2/source-code/public/git/analytics-is/product/integration/tests-integration/tests/src/test/resources/config/analytics-data-config.xml";
//        String apiConf = new File(analyticsDataConfigLocation).getAbsolutePath();
//        AnalyticsDataAPI analyticsDataAPI = new CarbonAnalyticsAPI(apiConf);
//        SubCategories subCategories = analyticsDataAPI.drillDownCategories(-1234, categoryDrillDownRequest);
//
//
//            if (subCategories.getCategories().size() == 10) {
//                CategorySearchResultEntry[] categorySearchResultEntryArray = subCategories.getCategories().toArray(new CategorySearchResultEntry[subCategories.getCategories().size()]);
//                for (int i = 0; i < 10; i++) {
//                    if (i == 0) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Sarah", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 971.0, "======= Invalid score received for user Sarah ==== ");
//                    } else if (i == 1) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Gary", "======= Invalid user name received ==== ");
//                        Assert.assertEquals(( categorySearchResultEntryArray[i]).getScore(), 949.0, "======= Invalid score received for user Gary ==== ");
//                    } else if (i == 2) {
//                        Assert.assertEquals(( categorySearchResultEntryArray[i]).getCategoryValue(), "Victor", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 541.0, "======= Invalid score received for user Victor ==== ");
//                    } else if (i == 3) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Laila", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 515.0, "======= Invalid score received for user Laila ==== ");
//                    } else if (i == 4) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "David", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 500.0, "======= Invalid score received for user David ==== ");
//                    } else if (i == 5) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Jessica", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 499.0, "======= Invalid score received for user Jessica ==== ");
//                    } else if (i == 6) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Felix", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 499.0, "======= Invalid score received for user Felix ==== ");
//                    } else if (i == 7) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Isabelle", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 493.0, "======= Invalid score received for user Isabelle ==== ");
//                    } else if (i == 8) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Elizabeth", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 493.0, "======= Invalid score received for user Elizabeth ==== ");
//                    } else if (i == 9) {
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getCategoryValue(), "Celine", "======= Invalid user name received ==== ");
//                        Assert.assertEquals((categorySearchResultEntryArray[i]).getScore(), 492.0, "======= Invalid score received for user Celine ==== ");
//                    }
//                }
//            } else {
//                Assert.fail("================ Invalid no of users received ============================");
//            }
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
