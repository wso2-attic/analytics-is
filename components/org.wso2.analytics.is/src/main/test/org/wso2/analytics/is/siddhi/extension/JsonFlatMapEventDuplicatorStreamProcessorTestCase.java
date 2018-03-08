/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.analytics.is.siddhi.extension;

import junit.framework.Assert;
import org.junit.Before;
import org.junit.Test;
import org.wso2.siddhi.core.ExecutionPlanRuntime;
import org.wso2.siddhi.core.SiddhiManager;
import org.wso2.siddhi.core.event.Event;
import org.wso2.siddhi.core.query.output.callback.QueryCallback;
import org.wso2.siddhi.core.stream.input.InputHandler;
import org.wso2.siddhi.core.util.EventPrinter;

public class JsonFlatMapEventDuplicatorStreamProcessorTestCase {
    private int inEventCount;
    private int removeEventCount;
    private boolean eventArrived;

    @Before
    public void init() {
        inEventCount = 0;
        removeEventCount = 0;
        eventArrived = false;
    }

    @Test
    public void eventDuplicatorDefaultDelimiterTest1() throws InterruptedException {
        SiddhiManager siddhiManager = new SiddhiManager();

        String cseEventStream = "define stream claimsStream " +
                "(username string, userStoreDomain string, tenantDomain string, claims string);";
        String query = "" +
                "@info(name = 'query1') " +
                "from claimsStream#isAnalytics:claimDuplicator(claims) " +
                "select * " +
                "insert all events into outputStream;";

        ExecutionPlanRuntime executionPlanRuntime = siddhiManager.createExecutionPlanRuntime(cseEventStream + query);

        executionPlanRuntime.addCallback("query1", new QueryCallback() {
            @Override
            public void receive(long timeStamp, Event[] inEvents, Event[] removeEvents) {
                EventPrinter.print(timeStamp, inEvents, removeEvents);
                if (inEvents != null) {
                    inEventCount += inEvents.length;
                }
                if (removeEvents != null) {
                    Assert.assertTrue("InEvents should arrive before RemoveEvents",
                            inEventCount > removeEventCount);
                    removeEventCount += removeEvents.length;
                }
                eventArrived = true;

                if (inEvents != null) {
                    if (inEventCount == 2) {
                        Assert.assertEquals(inEvents.length, 2);
                        Assert.assertEquals("nadund", inEvents[0].getData(0));
                        Assert.assertEquals("PRIMARY", inEvents[0].getData(1));
                        Assert.assertEquals("carbon.super", inEvents[0].getData(2));
                        Assert.assertEquals("{\"urn:scim:schemas:core:1.0:userName\":\"nadund\"," +
                                        "\"http://wso2.org/claims/organization\":\"WSO2\"}", inEvents[0].getData(3));
                        Assert.assertEquals("urn:scim:schemas:core:1.0:userName", inEvents[0].getData(4));
                        Assert.assertEquals("nadund", inEvents[0].getData(5));

                        Assert.assertEquals("nadund", inEvents[1].getData(0));
                        Assert.assertEquals("PRIMARY", inEvents[1].getData(1));
                        Assert.assertEquals("carbon.super", inEvents[1].getData(2));
                        Assert.assertEquals("{\"urn:scim:schemas:core:1.0:userName\":\"nadund\"," +
                                        "\"http://wso2.org/claims/organization\":\"WSO2\"}", inEvents[1].getData(3));
                        Assert.assertEquals("http://wso2.org/claims/organization", inEvents[1].getData(4));
                        Assert.assertEquals("WSO2", inEvents[1].getData(5));
                    } else if (inEventCount == 5) {
                        Assert.assertEquals(3, inEvents.length);
                        Assert.assertEquals("john", inEvents[0].getData(0));
                        Assert.assertEquals("LEGACY", inEvents[0].getData(1));
                        Assert.assertEquals("tester.com", inEvents[0].getData(2));
                        Assert.assertEquals("{\"urn:scim:schemas:core:1.0:userName\":\"john\"," +
                                        "\"http://wso2.org/claims/organization\":\"IBM\"," +
                                        "\"http://wso2.org/claims/emailaddress\":\"john@gmail.com\"}",
                                inEvents[0].getData(3));
                        Assert.assertEquals("urn:scim:schemas:core:1.0:userName", inEvents[0].getData(4));
                        Assert.assertEquals("john", inEvents[0].getData(5));

                        Assert.assertEquals("john", inEvents[1].getData(0));
                        Assert.assertEquals("LEGACY", inEvents[1].getData(1));
                        Assert.assertEquals("tester.com", inEvents[1].getData(2));
                        Assert.assertEquals("{\"urn:scim:schemas:core:1.0:userName\":\"john\"," +
                                        "\"http://wso2.org/claims/organization\":\"IBM\"," +
                                        "\"http://wso2.org/claims/emailaddress\":\"john@gmail.com\"}",
                                inEvents[1].getData(3));
                        Assert.assertEquals("http://wso2.org/claims/organization", inEvents[1].getData(4));
                        Assert.assertEquals("IBM", inEvents[1].getData(5));

                        Assert.assertEquals("john", inEvents[2].getData(0));
                        Assert.assertEquals("LEGACY", inEvents[2].getData(1));
                        Assert.assertEquals("tester.com", inEvents[2].getData(2));
                        Assert.assertEquals("{\"urn:scim:schemas:core:1.0:userName\":\"john\"," +
                                        "\"http://wso2.org/claims/organization\":\"IBM\"," +
                                        "\"http://wso2.org/claims/emailaddress\":\"john@gmail.com\"}",
                                inEvents[2].getData(3));
                        Assert.assertEquals("http://wso2.org/claims/emailaddress", inEvents[2].getData(4));
                        Assert.assertEquals("john@gmail.com", inEvents[2].getData(5));
                    }
                }
            }
        });

        InputHandler inputHandler = executionPlanRuntime.getInputHandler("claimsStream");
        executionPlanRuntime.start();
        inputHandler.send(new Object[]{"nadund", "PRIMARY", "carbon.super",
                "{\"urn:scim:schemas:core:1.0:userName\":\"nadund\"," +
                        "\"http://wso2.org/claims/organization\":\"WSO2\"}"});
        inputHandler.send(new Object[]{"john", "LEGACY", "tester.com",
                "{\"urn:scim:schemas:core:1.0:userName\":\"john\"," +
                        "\"http://wso2.org/claims/organization\":\"IBM\"," +
                        "\"http://wso2.org/claims/emailaddress\":\"john@gmail.com\"}"});
        Thread.sleep(4000);
        Assert.assertEquals(5, inEventCount);
        Assert.assertEquals(0, removeEventCount);
        Assert.assertTrue(eventArrived);
        executionPlanRuntime.shutdown();
    }
}
