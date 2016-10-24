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
import org.wso2.carbon.integration.common.utils.mgt.ServerConfigurationManager;
import org.wso2.carbon.utils.multitenancy.MultitenantConstants;
import org.wso2.das.integration.common.utils.DASIntegrationTest;
import org.wso2.das4is.integration.common.clients.DataPublisherClient;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ScenarioConfigurationDTO;
import org.wso2.carbon.event.template.manager.admin.dto.configuration.xsd.ConfigurationParameterDTO;
import org.wso2.carbon.event.template.manager.stub.TemplateManagerAdminServiceStub;
import org.wso2.carbon.event.processor.stub.EventProcessorAdminServiceStub;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.rmi.RemoteException;

public class ISAlertLongSessionsAnalyticsTestCase extends DASIntegrationTest {

    private static final Log log = LogFactory.getLog(ISAlertLongSessionsAnalyticsTestCase.class);
    private ServerConfigurationManager serverManager;
    private DataPublisherClient dataPublisherClient;
    private AnalyticsDataAPI analyticsDataAPI;
    private AnalyticsProcessorAdminServiceStub analyticsStub;
    private TemplateManagerAdminServiceStub templateManagerAdminServiceStub;
    private EventProcessorAdminServiceStub eventProcessorAdminServiceStub;
    private static final String ANALYTICS_SERVICE_NAME = "AnalyticsProcessorAdminService";
    private static final String TEMPLATE_MANAGER_SERVICE_NAME = "TemplateManagerAdminService";
    private static final String EVENT_PROCESSOR_SERVICE_NAME = "EventProcessorAdminService";

    @BeforeClass(alwaysRun = true)
    protected void init() throws Exception {
        super.init();
        String rdbmsConfigArtifactLocation = FrameworkPathUtil.getSystemResourceLocation() + File.separator + "config" +
                File.separator + "rdbms-config.xml";
        String rdbmsConfigLocation =
                FrameworkPathUtil.getCarbonHome() + File.separator + "repository" + File.separator + "conf"
                        + File.separator + "analytics" + File.separator + "rdbms-config.xml";
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

        // configuring ISAnalytics-ConfigureAlertLongSessions template
        initEventProcessorStub();
        int activeExecutionPlanCount = getActiveExecutionPlanCount();
        initTemplateManagerStub();
        ScenarioConfigurationDTO isAnalyticsExecutionPlan = templateManagerAdminServiceStub
                .getConfiguration("ISAnalytics", "ConfigureAlertLongSessions");
        ConfigurationParameterDTO[] params = isAnalyticsExecutionPlan.getConfigurationParameterDTOs();
        // set session duration threshold value to 5 mins
        if ((params[2].getName()).equals("sessionDurationThreshold")) {
            params[2].setValue("300000");
        }
        if ((params[1].getName()).equals("avgPercentageThreshold")) {
            params[1].setValue("10.0");
        }
        if ((params[0].getName()).equals("numberOfDays")) {
            params[0].setValue("7");
        }
        isAnalyticsExecutionPlan.setConfigurationParameterDTOs(params);
        templateManagerAdminServiceStub.editConfiguration(isAnalyticsExecutionPlan);
        do {
            Thread.sleep(1000);
        } while (getActiveExecutionPlanCount() != activeExecutionPlanCount + 1);
    }

    //==========================  Alert Long Session Durations  ========================================================

    @Test(groups = "wso2.analytics.is", description = "Publishing sample events to DAS4is")
    public void publishData() throws Exception {

        serverManager = new ServerConfigurationManager(dasServer);
        String sampleCSVDataFileName = "longSessionData.csv";
        String sampleDataFilePath = FrameworkPathUtil.getSystemResourceLocation() +
                "sampleData" + File.separator;
        String streamId = "org.wso2.is.analytics.stream.OverallSession:1.0.0";

        try {
            BufferedReader br = new BufferedReader(new FileReader(sampleDataFilePath + sampleCSVDataFileName),
                    10 * 1024 * 1024);
            String line = br.readLine();
            long currentTime = System.currentTimeMillis();
            long timeDifference = 1000000;
            while (line != null) {
                String[] eventObject = line.split(",");
                line = br.readLine();
                Object[] payload = new Object[]{
                        eventObject[0] + "",
                        currentTime - timeDifference,
                        0L,
                        currentTime + 1000000,
                        Integer.valueOf(eventObject[1]),
                        eventObject[2],
                        eventObject[3],
                        eventObject[4],
                        eventObject[5],
                        eventObject[6],
                        eventObject[7],
                        eventObject[8],
                        Boolean.valueOf(eventObject[9]),
                        eventObject[10],
                        currentTime
                };
                Event event = new Event(streamId, System.currentTimeMillis(), new Object[]{-1234}, null, payload);
                dataPublisherClient.publish(event);
                Thread.sleep(100);
                timeDifference -= 100000;
            }
            dataPublisherClient.shutdown();
        } catch (Throwable e) {
            log.error("Error when publishing sample session data", e);
        }

        //run spark scripts for session duration calculations
        analyticsStub.executeScriptInBackground("IsAnalytics-SparkScript-SessionManagement");
        Thread.sleep(30000);
        analyticsStub.executeScriptInBackground("ISAnalytics-SparkScript-AlertLongSessions");
        Thread.sleep(30000);
    }

    @Test(groups = "wso2.analytics.is", description = "Checking total long session count", dependsOnMethods = "publishData")
    public void retrieveTableCountTest() throws AnalyticsServiceException, AnalyticsException {

        final int EXPECTED_COUNT = 2;
        final int MAX_WAIT_COUNT = 10;
        final String LONGSESSIONS_TABLE = "ORG_WSO2_IS_ANALYTICS_STREAM_LONGSESSIONS";
        int waitCount = 0;
        while (analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, LONGSESSIONS_TABLE,
                Long.MIN_VALUE, Long.MAX_VALUE) < EXPECTED_COUNT && waitCount < MAX_WAIT_COUNT) {
            if (waitCount > 0) {
                try {
                    Thread.sleep(20000);
                } catch (InterruptedException e) {
                    // ignore
                }
            }
            waitCount++;
        }

        long eventCount = analyticsDataAPI.getRecordCount(MultitenantConstants.SUPER_TENANT_ID, LONGSESSIONS_TABLE, Long.MIN_VALUE, Long.MAX_VALUE);
        Assert.assertEquals(eventCount, EXPECTED_COUNT, "========== Total long session count is invalid ==========");
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