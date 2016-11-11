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

package org.wso2.das4is.integration.tests.jaggeryapi;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.automation.engine.frameworkutils.FrameworkPathUtil;
import org.wso2.carbon.automation.test.utils.http.client.HttpRequestUtil;
import org.wso2.carbon.automation.test.utils.http.client.HttpResponse;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.integration.common.utils.mgt.ServerConfigurationManager;
import org.wso2.das.integration.common.utils.TestConstants;
import org.wso2.das4is.integration.common.clients.DataPublisherClient;
import org.wso2.das4is.integration.common.clients.EventReceiverAdminServiceClient;
import org.wso2.das4is.integration.tests.is.DASIntegrationTest;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.testng.Assert.assertNotNull;
import static org.testng.Assert.assertTrue;

public class ISAnalyticsAlertsTestCase extends DASIntegrationTest {

    private static final Log log = LogFactory.getLog(ISAnalyticsAlertsTestCase.class);
    private static String ANALYTICS_ALERTS_ENDPOINT;
    private static EventReceiverAdminServiceClient eventReceiverAdminServiceClient;
    private static Map<String, String> httpHeaders = new HashMap<>();

    private DataPublisherClient dataPublisherClient;

    private int start;
    private int length;
    private long timeTo;
    private long timeFrom = 1436207400000L;


    @BeforeClass(alwaysRun = true)
    protected void init() throws Exception {

        super.init();

        httpHeaders.put("Content-Type", TestConstants.CONTENT_TYPE_JSON);
        httpHeaders.put("Accept", TestConstants.CONTENT_TYPE_JSON);
        httpHeaders.put("Authorization", TestConstants.BASE64_ADMIN_ADMIN);

        dataPublisherClient = new DataPublisherClient("tcp://localhost:9411");

        eventReceiverAdminServiceClient = new EventReceiverAdminServiceClient(backendURL, getSessionCookie());

        ANALYTICS_ALERTS_ENDPOINT = dasServer.getContextUrls().getBackEndUrl().split("/services")[0]
                + "/portal/apis/isanalytics-alerts";

        timeTo = System.currentTimeMillis();
    }

    @AfterClass(alwaysRun = true)
    public void cleanup() throws Exception {

        eventReceiverAdminServiceClient.undeployEventReceiver("wso2eventreceiver1");
        dataPublisherClient.shutdown();

    }

    @Test(groups = "wso2.analytics.is", description = "Publishing sample events to Analytics server")
    public void publishData() throws Exception {

        // Adding event receiver
        eventReceiverAdminServiceClient.addOrUpdateEventReceiver("wso2eventreceiver1",
                readFile(FrameworkPathUtil.getSystemResourceLocation() + File.separator + "event-configs"
                        + File.separator + "wso2eventreceiver1.xml"));

        String sampleCSVDataFileName = "datafailurealerts.csv";
        String sampleDataFilePath = FrameworkPathUtil.getSystemResourceLocation() +
                "sampleData" + File.separator;

        String streamId = "org.wso2.is.analytics.stream.LoginSuccessAfterMultipleFailures:1.0.0";

        try {
            BufferedReader br = new BufferedReader(new FileReader(sampleDataFilePath + sampleCSVDataFileName),
                    10 * 1024 * 1024);

            String line = br.readLine();
            List<Event> sampleEventList = new ArrayList<>();

            while (line != null) {
                String[] eventObject = line.split(",");
                line = br.readLine();
                Object[] payload = new Object[]{eventObject[0],
                        Integer.valueOf(eventObject[1]),
                        eventObject[2],
                        (eventObject[3]),
                        Long.valueOf(eventObject[4])};

                Event event = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null, payload);
                sampleEventList.add(event);
            }
            dataPublisherClient.publish(sampleEventList);
            Thread.sleep(60000);
            dataPublisherClient.shutdown();
        } catch (Throwable e) {
            log.error("Error when publishing sample session data", e);
        }

    }

    @Test(groups = "wso2.analytics.is", description = "Getting the view alert table data",
            dependsOnMethods = "publishData")
    public void getViewAlertTableResults() throws Exception {

        start = 0;
        length = 10;

        String queryTableName = "SuspiciousLoginAlert";
        String url = ANALYTICS_ALERTS_ENDPOINT + "?draw=1;start=" + start + "&length=" + length +
                "&alertType=" + queryTableName + "&timeFrom=" + timeFrom + "&timeTo=" + timeTo;

        HttpResponse response = HttpRequestUtil.doGet(url, httpHeaders);
        log.info("Response: " + response.getData());

        assertNotNull(response + "Response is empty");
        assertTrue(response.getData().contains("\"username\" : \"user1010\""),
                "username, user1010 event not found");
        assertTrue(response.getData().contains
                        ("Successful login attempt after multiple login failures from same remote IP detected") ,
                "Response message mismatch");

    }

    @Test(groups = "wso2.analytics.is", description = "Getting the summery results counts",
            dependsOnMethods = "getViewAlertTableResults")
    public void getSummeryResult() throws Exception {

        String url = ANALYTICS_ALERTS_ENDPOINT + "?draw=1;start=" + start + "&length=" + length +
                "&query=summery" + "&timeFrom=" + timeFrom + "&timeTo=" + timeTo;

        HttpResponse response = HttpRequestUtil.doGet(url, httpHeaders);
        log.info("Response: " + response.getData());

        assertNotNull(response + "Response is empty");
        assertTrue(response.getData().contains("\"data\" : [{\"key\" : \"SuspiciousLoginAlert\""), "Table key mismatch");
        assertTrue(response.getData().contains("\"display\" : \"Suspicious_Login_Alerts\", \"count\""),
                "Table display name mismatch");

    }

    private String readFile(String path) throws IOException {
        String sCurrentLine;
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new FileReader(path))) {

            while ((sCurrentLine = br.readLine()) != null) {
                sb.append(sCurrentLine);
            }

        }

        return sb.toString();
    }
}