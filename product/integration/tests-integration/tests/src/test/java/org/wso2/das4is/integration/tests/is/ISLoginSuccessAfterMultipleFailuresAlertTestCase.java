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
import org.wso2.carbon.analytics.datasource.commons.exception.AnalyticsException;
import org.wso2.carbon.analytics.spark.admin.stub.AnalyticsProcessorAdminServiceStub;
import org.wso2.carbon.automation.engine.frameworkutils.FrameworkPathUtil;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ConfigurationParameterDTO;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ScenarioConfigurationDTO;
import org.wso2.carbon.integration.common.utils.mgt.ServerConfigurationManager;
import org.wso2.carbon.utils.multitenancy.MultitenantConstants;
import org.wso2.das.integration.common.utils.DASIntegrationTest;
import org.wso2.das4is.integration.common.clients.DataPublisherClient;
import org.wso2.carbon.event.template.manager.stub.TemplateManagerAdminServiceStub;
import org.wso2.carbon.event.processor.stub.EventProcessorAdminServiceStub;

import java.io.File;
import java.rmi.RemoteException;

public class ISLoginSuccessAfterMultipleFailuresAlertTestCase extends DASIntegrationTest {

    private static final Log log = LogFactory.getLog(ISLoginSuccessAfterMultipleFailuresAlertTestCase.class);

    private ServerConfigurationManager serverManager;
    private DataPublisherClient dataPublisherClient;
    private AnalyticsDataAPI analyticsDataAPI;
    private static final String ANALYTICS_SERVICE_NAME = "AnalyticsProcessorAdminService";
    private static final String TEMPLATE_MANAGER_SERVICE_NAME = "TemplateManagerAdminService";
    private static final String EVENT_PROCESSOR_SERVICE_NAME = "EventProcessorAdminService";
    private AnalyticsProcessorAdminServiceStub analyticsStub;
    private TemplateManagerAdminServiceStub templateManagerAdminServiceStub;
    private EventProcessorAdminServiceStub eventProcessorAdminServiceStub;
    private String streamId = "org.wso2.is.analytics.stream.OverallAuthentication:1.0.0";

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
        Thread.sleep(300000);
        dataPublisherClient = new DataPublisherClient("tcp://localhost:9411");
        String apiConf = new File(analyticsDataConfigLocation).getAbsolutePath();
        analyticsDataAPI = new CarbonAnalyticsAPI(apiConf);
        initAnalyticsProcessorStub();

        // configuring ISAnalytics-SuspiciousLoginAlerts template
        initEventProcessorStub();
        int activeExecutionPlanCount = getActiveExecutionPlanCount();
        initTemplateManagerStub();
        ScenarioConfigurationDTO isAnalyticsExecutionPlan = templateManagerAdminServiceStub.getConfiguration("ISAnalytics", "ConfigureSuspiciousLoginDetection");
        ConfigurationParameterDTO[] params = isAnalyticsExecutionPlan.getConfigurationParameterDTOs();
        if ((params[0].getName()).equals("minLoginFailures")) {
            params[0].setValue("5");
        }
        if ((params[1].getName()).equals("timeDuration")) {
            params[1].setValue("1");
        }
        isAnalyticsExecutionPlan.setConfigurationParameterDTOs(params);
        templateManagerAdminServiceStub.editConfiguration(isAnalyticsExecutionPlan);
        do {
            Thread.sleep(1000);
        } while (getActiveExecutionPlanCount() != activeExecutionPlanCount + 1);
    }

    @Test(groups = "wso2.analytics.is", description = "Publishing sample events for suspicious login alerts")
    public void publishData() throws Exception {

        serverManager = new ServerConfigurationManager(dasServer);
        try {

            Event failureEvent1 = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "1", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("False"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(failureEvent1);
            Thread.sleep(100);

            Event failureEvent2 = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "2", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("False"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(failureEvent2);
            Thread.sleep(100);

            Event failureEvent3 = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "3", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("False"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(failureEvent3);
            Thread.sleep(100);

            Event failureEvent4 = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "4", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("False"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(failureEvent4);
            Thread.sleep(100);

            Event failureEvent5 = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "5", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("False"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(failureEvent5);
            Thread.sleep(100);

            Event failureEvent6 = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "6", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("False"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(failureEvent6);
            Thread.sleep(100);

            Event failureEvent7 = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "7", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("False"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(failureEvent7);
            Thread.sleep(100);

            Event successStepEvent = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "8", "step", Boolean.valueOf("False"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("True"), "BasicAuthenticator", Boolean.valueOf("False"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(successStepEvent);
            Thread.sleep(100);


            Event successOverallEvent = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null,
                    new Object[]{"1", "9", "overall", Boolean.valueOf("True"), " admin", "admin", "PRIMARY", "carbon.super", "127.0.0.1", "", "samlsso", "travelocity.com", Boolean.valueOf("False"), Boolean.valueOf("False"), Boolean.valueOf("False"), "admin", "1", "LOCAL", Boolean.valueOf("True"), "BasicAuthenticator", Boolean.valueOf("True"), "LOCAL", System.currentTimeMillis()});
            dataPublisherClient.publish(successOverallEvent);

            Thread.sleep(5000);
            dataPublisherClient.shutdown();

        } catch (Throwable e) {
            log.error("Error when publishing sample authentication events for suspicious login alert", e);
        }
    }

    @Test(groups = "wso2.analytics.is", description = "Check Alert Event Count", dependsOnMethods = "publishData")
    public void retrieveAlertEventCountTest() throws AnalyticsServiceException, AnalyticsException {

        final int EXPECTED_COUNT = 3;
        final int MAX_WAIT_COUNT = 4;
        final String LOGINSUCCESSAFTERMULTIPLEFAILURES_TABLE = "ORG_WSO2_IS_ANALYTICS_STREAM_LOGINSUCCESSAFTERMULTIPLEFAILURES";
        int waitCount = 0;
        while (analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, LOGINSUCCESSAFTERMULTIPLEFAILURES_TABLE,
                Long.MIN_VALUE, Long.MAX_VALUE) < EXPECTED_COUNT && waitCount < MAX_WAIT_COUNT) {
            if (waitCount > 0) {
                try {
                    Thread.sleep(60000);
                } catch (InterruptedException e) {
                    // ignore
                }
            }
            waitCount++;
        }

        long eventCount = analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, LOGINSUCCESSAFTERMULTIPLEFAILURES_TABLE, Long.MIN_VALUE, Long.MAX_VALUE);
        Assert.assertEquals(eventCount, EXPECTED_COUNT, "========== Alert event count is invalid ================");
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

    private void initTemplateManagerStub() throws Exception {
        ConfigurationContext configContext = ConfigurationContextFactory.
                createConfigurationContextFromFileSystem(null);
        String loggedInSessionCookie = getSessionCookie();
        templateManagerAdminServiceStub = new TemplateManagerAdminServiceStub(configContext,
                backendURL + "/services/" + TEMPLATE_MANAGER_SERVICE_NAME);
        ServiceClient client = templateManagerAdminServiceStub._getServiceClient();
        Options option = client.getOptions();
        option.setManageSession(true);
        option.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING,
                loggedInSessionCookie);
    }

    private void initEventProcessorStub() throws Exception {
        ConfigurationContext configContext = ConfigurationContextFactory.
                createConfigurationContextFromFileSystem(null);
        String loggedInSessionCookie = getSessionCookie();
        eventProcessorAdminServiceStub = new EventProcessorAdminServiceStub(configContext,
                backendURL + "/services/" + EVENT_PROCESSOR_SERVICE_NAME);
        ServiceClient client = eventProcessorAdminServiceStub._getServiceClient();
        Options option = client.getOptions();
        option.setManageSession(true);
        option.setProperty(org.apache.axis2.transport.http.HTTPConstants.COOKIE_STRING,
                loggedInSessionCookie);
    }

    private int getActiveExecutionPlanCount() throws RemoteException {
        return eventProcessorAdminServiceStub.getAllActiveExecutionPlanConfigurations().length;
    }
}
