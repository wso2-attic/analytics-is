/*
*  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
*  WSO2 Inc. licenses this file to you under the Apache License,
*  Version 2.0 (the "License"); you may not use this file except
*  in compliance with the License.
*  You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/
package org.wso2.das4is.integration.tests.is;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.utils.multitenancy.MultitenantConstants;
import org.wso2.das4is.integration.common.clients.DataPublisherClient;

import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.List;

public class AbnormalTokenRefreshTestCase extends ISAnalyticsBaseTestCase {

    private static final Log log = LogFactory.getLog(AbnormalTokenRefreshTestCase.class);

    private final String STREAM_NAME = "org.wso2.is.analytics.stream.OauthTokenIssuance";
    private final String STREAM_ID = "org.wso2.is.analytics.stream.OauthTokenIssuance:1.0.0";
    private final String TEST_RESOURCE_PATH = "analytics/is/artifacts/abnormalTokenRefresh";
    private final String PUBLISHER_FILE = "logger_abnormalAccessTokenRefresh.xml";
    private final String SPARK_SCRIPT = "ISAnalytics-ConfigureAccessToken-ConfigureAccessToken-batch1";
    private final String SUMMARY_TABLE = "ORG_WSO2_IS_ANALYTICS_ACCESSTOKENREFRESHSUMMARYTABLE";
    private final String REFRESH_TIME_DIFFERENCE_TABLE = "ORG_WSO2_IS_ANALYTICS_ACCESSTOKENREFRESHTIMEDIFFERENCE";
    private final String LAST_ACCESS_TOKEN_REFRESH_TABLE = "ORG_WSO2_IS_ANALYTICS_LASTACCESSTOKENREFRESHEVENTTABLE";
    private final String EXECUTION_PLAN_NAME = "ISAnalytics-AbnormalAccessTokenRefresh";
    private final int MAX_TRIES = 5;
    private long initialTimestamp;
    private String BASE_EVENT_ONE_STRING = "is,carbon.super,home,s8SWbnmzQEgzMIsol7AHt9cjhEsa,refresh_token,id1232,"
            + "ab,c,true,200,success,86400,604800,";
    private String BASE_EVENT_TWO_STRING = "is,carbon.super,home,h8jfbnghUKepMIulu43Ht9cjaRfh,refresh_token,id1242,ab,"
            + "c,true,200,success,86400,604800,";
    private DataPublisherClient dataPublisherClient;

    @BeforeClass(alwaysRun = true)
    public void setup() throws Exception {
        super.init();
        dataPublisherClient = new DataPublisherClient("tcp://localhost:9411");
        initialTimestamp = System.currentTimeMillis() - 6000;
        // deploy the publisher xml file
        deployPublisher(TEST_RESOURCE_PATH, PUBLISHER_FILE);
        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, STREAM_NAME.replace('.', '_'))) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, SUMMARY_TABLE)) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, SUMMARY_TABLE);

        }
        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, REFRESH_TIME_DIFFERENCE_TABLE)) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, REFRESH_TIME_DIFFERENCE_TABLE);

        }
        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, LAST_ACCESS_TOKEN_REFRESH_TABLE)) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, LAST_ACCESS_TOKEN_REFRESH_TABLE);

        }
        editActiveExecutionPlan(getActiveExecutionPlan(EXECUTION_PLAN_NAME), EXECUTION_PLAN_NAME);
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {
        dataPublisherClient.shutdown();

        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, STREAM_NAME.replace('.', '_'))) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, STREAM_NAME.replace('.', '_'));
        }
        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, SUMMARY_TABLE)) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, SUMMARY_TABLE);

        }
        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, REFRESH_TIME_DIFFERENCE_TABLE)) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, REFRESH_TIME_DIFFERENCE_TABLE);

        }
        if (isTableExist(MultitenantConstants.SUPER_TENANT_ID, LAST_ACCESS_TOKEN_REFRESH_TABLE)) {
            deleteData(MultitenantConstants.SUPER_TENANT_ID, LAST_ACCESS_TOKEN_REFRESH_TABLE);

        }
        // undeploy the publishers
        undeployPublisher(PUBLISHER_FILE);

    }

    @Test(groups = "wso2.analytics.is",
          description = "Tests if the Spark script is deployed")
    public void testSparkScriptDeployment() throws Exception {
        Assert.assertTrue(isSparkScriptExists(SPARK_SCRIPT),
                "Abnormal Token Refresh Alert spark script is not deployed!");
    }

    @Test(groups = "wso2.analytics.is",
          description = "Test if the Simulation data has been published",
          dependsOnMethods = "testSparkScriptDeployment")
    public void testSimulationDataSent() throws Exception {
        //publish training data
        List<Event> eventList = publishSimulationData();
        dataPublisherClient.publish(eventList);

        int i = 0;
        long oAuthEventCount = 0;
        boolean eventsPublished = false;
        while (i < MAX_TRIES) {
            Thread.sleep(2000);
            oAuthEventCount = getRecordCount(MultitenantConstants.SUPER_TENANT_ID, STREAM_NAME.replace('.', '_'));
            eventsPublished = (oAuthEventCount >= 12);
            if (eventsPublished) {
                break;
            }
            i++;
        }
        Assert.assertTrue(eventsPublished,
                "Simulation events did not get published , expected entry count:6 but found: " + oAuthEventCount + "!");
    }

    @Test(groups = "wso2.analytics.is",
          description = "Test Abnormal Access Token Refresh Alert Spark Script execution",
          dependsOnMethods = "testSimulationDataSent")
    public void testScriptExecution() throws Exception {
        //run the script
        executeSparkScript(SPARK_SCRIPT);

        int i = 0;
        long summaryTableCount = 0;
        boolean scriptExecuted = false;
        while (i < MAX_TRIES) {
            Thread.sleep(10000);
            summaryTableCount = getRecordCount(MultitenantConstants.SUPER_TENANT_ID, SUMMARY_TABLE);
            scriptExecuted = (summaryTableCount >= 1);
            if (scriptExecuted) {
                break;
            }
            i++;
        }
        Assert.assertTrue(scriptExecuted,
                "Spark script did not execute as expected, expected entry count:1 but found: " + summaryTableCount
                        + "!");
    }

    @Test(groups = "wso2.analytics.is",
          description = "Test Abnormal Access Token Refresh Alert is not generated for " + "normal scenarios",
          dependsOnMethods = "testScriptExecution")
    public void testNormalTokenRefreshAlert() throws Exception {
        logViewerClient.clearLogs();

        String[] eventObject1 = BASE_EVENT_ONE_STRING.split(",");
        Object[] payloadOne = new Object[] {
                eventObject1[0], eventObject1[1], eventObject1[2], eventObject1[3], eventObject1[4], eventObject1[5],
                eventObject1[6], eventObject1[7], Boolean.valueOf(eventObject1[8]), eventObject1[9], eventObject1[10],
                Long.valueOf(eventObject1[11]), Long.valueOf(eventObject1[12])
        };

        Object[] payload1 = ArrayUtils.add(payloadOne, initialTimestamp + 652);
        Event event1 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload1);

        Event event2 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload1);

        dataPublisherClient.publish(event1);
        dataPublisherClient.publish(event2);

        boolean abnormalTokenRefreshFound = isAlertReceived(0,
                "msg:Abnormal Access Token Refresh Detected " + "from User:carbon.super-home-is", 5, 2000);
        Assert.assertFalse(abnormalTokenRefreshFound, "Abnormal Token Refresh Alert is received!");
    }

    @Test(groups = "wso2.analytics.is",
          description = "Test Abnormal Access Token Refresh Alert",
          dependsOnMethods = "testNormalTokenRefreshAlert")
    public void testAbnormalTokenRefreshAlert() throws Exception {
        logViewerClient.clearLogs();

        String[] eventObject1 = BASE_EVENT_ONE_STRING.split(",");
        Object[] payloadOne = new Object[] {
                eventObject1[0], eventObject1[1], eventObject1[2], eventObject1[3], eventObject1[4], eventObject1[5],
                eventObject1[6], eventObject1[7], Boolean.valueOf(eventObject1[8]), eventObject1[9], eventObject1[10],
                Long.valueOf(eventObject1[11]), Long.valueOf(eventObject1[12])
        };

        String[] eventObject2 = BASE_EVENT_TWO_STRING.split(",");
        Object[] payloadTwo = new Object[] {
                eventObject2[0], eventObject2[1], eventObject2[2], eventObject2[3], eventObject2[4], eventObject2[5],
                eventObject2[6], eventObject2[7], Boolean.valueOf(eventObject2[8]), eventObject2[9], eventObject2[10],
                Long.valueOf(eventObject2[11]), Long.valueOf(eventObject2[12])
        };

        Object[] payload1 = ArrayUtils.add(payloadOne, initialTimestamp + 55550);
        Event event1 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload1);
        Event event2 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload1);
        dataPublisherClient.publish(event1);
        dataPublisherClient.publish(event2);

        Object[] payload2 = ArrayUtils.add(payloadTwo, initialTimestamp + 65550);
        Event event3 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload2);
        Event event4 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload2);
        dataPublisherClient.publish(event3);
        dataPublisherClient.publish(event4);

        boolean abnormalTokenRefreshFound = isAlertReceived(0, "msg:Abnormal access token refresh detected", 50, 5000);
        Assert.assertTrue(abnormalTokenRefreshFound, "Abnormal Token Refresh Alert event not received!");
    }

    private List<Event> publishSimulationData() throws RemoteException {
        List<Event> eventsList = new ArrayList<>();

        String[] eventObject1 = BASE_EVENT_ONE_STRING.split(",");
        Object[] payloadOne = new Object[] {
                eventObject1[0], eventObject1[1], eventObject1[2], eventObject1[3], eventObject1[4], eventObject1[5],
                eventObject1[6], eventObject1[7], Boolean.valueOf(eventObject1[8]), eventObject1[9], eventObject1[10],
                Long.valueOf(eventObject1[11]), Long.valueOf(eventObject1[12])
        };

        String[] eventObject2 = BASE_EVENT_TWO_STRING.split(",");
        Object[] payloadTwo = new Object[] {
                eventObject2[0], eventObject2[1], eventObject2[2], eventObject2[3], eventObject2[4], eventObject2[5],
                eventObject2[6], eventObject2[7], Boolean.valueOf(eventObject2[8]), eventObject2[9], eventObject2[10],
                Long.valueOf(eventObject2[11]), Long.valueOf(eventObject2[12])
        };

        Object[] payload1 = ArrayUtils.add(payloadOne, initialTimestamp + 90);
        Event event1 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload1);
        Event event2 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload1);

        Object[] payload2 = ArrayUtils.add(payloadOne, initialTimestamp + 190);
        Event event3 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload2);
        Event event4 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload2);

        Object[] payload3 = ArrayUtils.add(payloadOne, initialTimestamp + 259);
        Event event5 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload3);
        Event event6 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload3);

        Object[] payload4 = ArrayUtils.add(payloadOne, initialTimestamp + 385);
        Event event7 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload4);
        Event event8 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload4);

        Object[] payload5 = ArrayUtils.add(payloadOne, initialTimestamp + 400);
        Event event9 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload5);
        Event event10 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload5);

        Object[] payload6 = ArrayUtils.add(payloadOne, initialTimestamp + 502);
        Event event11 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload6);
        Event event12 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload6);

        Object[] payload7 = ArrayUtils.add(payloadTwo, initialTimestamp + 90);
        Event event13 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload7);
        Event event14 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload7);

        Object[] payload8 = ArrayUtils.add(payloadTwo, initialTimestamp + 190);
        Event event15 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload8);
        Event event16 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload8);

        Object[] payload9 = ArrayUtils.add(payloadTwo, initialTimestamp + 259);
        Event event17 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload9);
        Event event18 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload9);

        Object[] payload10 = ArrayUtils.add(payloadTwo, initialTimestamp + 385);
        Event event19 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload10);
        Event event20 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload10);

        Object[] payload11 = ArrayUtils.add(payloadTwo, initialTimestamp + 400);
        Event event21 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload11);
        Event event22 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload11);

        Object[] payload12 = ArrayUtils.add(payloadTwo, initialTimestamp + 502);
        Event event23 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { -1234 }, null, payload12);
        Event event24 = new Event(STREAM_ID, System.currentTimeMillis(), new Object[] { 1 }, null, payload12);

        eventsList.add(event1);
        eventsList.add(event2);
        eventsList.add(event3);
        eventsList.add(event4);
        eventsList.add(event5);
        eventsList.add(event6);
        eventsList.add(event7);
        eventsList.add(event8);
        eventsList.add(event9);
        eventsList.add(event10);
        eventsList.add(event11);
        eventsList.add(event12);
        eventsList.add(event13);
        eventsList.add(event14);
        eventsList.add(event15);
        eventsList.add(event16);
        eventsList.add(event17);
        eventsList.add(event18);
        eventsList.add(event19);
        eventsList.add(event20);
        eventsList.add(event21);
        eventsList.add(event22);
        eventsList.add(event23);
        eventsList.add(event24);

        return eventsList;
    }
}
