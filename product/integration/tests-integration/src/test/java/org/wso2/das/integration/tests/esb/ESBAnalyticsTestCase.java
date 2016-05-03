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

package org.wso2.das.integration.tests.esb;

import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import org.wso2.carbon.databridge.commons.Event;
import org.wso2.das.integration.common.utils.DASIntegrationTest;
import org.wso2.das4esb.integration.common.clients.DataPublisherClient;

import java.util.UUID;

/**
 * Created on 4/7/16.
 */
public class ESBAnalyticsTestCase extends DASIntegrationTest {
    private DataPublisherClient dataPublisherClient;

    @BeforeClass(alwaysRun = true, dependsOnGroups = "wso2.das")
    protected void init() throws Exception {
        super.init();
        dataPublisherClient = new DataPublisherClient();
    }

    @Test(groups = "wso2.das4esb.config", description = "Publish config")
    public void publishData() throws Exception {
        Event event = new Event();
        /*Object[] payload = new Object[3];
        payload[0] = UUID.randomUUID();
        payload[1] = "LicenseServiceProxy";
        payload[2] = ""
        event.setPayloadData();
        dataPublisherClient.publish("esb-config-entry-stream", "1.0.0", event);*/
    }

}
