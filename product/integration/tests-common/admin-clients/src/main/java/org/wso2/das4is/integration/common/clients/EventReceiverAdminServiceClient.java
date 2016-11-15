/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


package org.wso2.das4is.integration.common.clients;

import org.apache.axis2.AxisFault;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.event.receiver.stub.EventReceiverAdminServiceStub;
import org.wso2.carbon.event.receiver.stub.types.EventReceiverConfigurationDto;

import java.rmi.RemoteException;

/**
 * This class represents a client to do event receiver artifact related actions.
 */
public class EventReceiverAdminServiceClient {

    private static final Log log = LogFactory.getLog(EventReceiverAdminServiceClient.class);

    private static final String serviceName = "EventReceiverAdminService";

    private EventReceiverAdminServiceStub eventReceiverStub;

    public EventReceiverAdminServiceClient(String backEndUrl, String sessionCookie) throws AxisFault {
        try {
            this.eventReceiverStub = new EventReceiverAdminServiceStub(backEndUrl + serviceName);
            AuthenticateStubUtil.authenticateStub(sessionCookie, this.eventReceiverStub);
        } catch (AxisFault e) {
            String msg = "Event Receiver Stub Initialization failed: " + e.getMessage();
            log.error(msg, e);
            throw new AxisFault(msg, e);
        }
    }

    public EventReceiverConfigurationDto getActiveEventReceiver(String name) throws RemoteException {
        return this.eventReceiverStub.getActiveEventReceiverConfiguration(name);
    }

    public void undeployEventReceiver(String name) throws RemoteException {
        try {
            this.eventReceiverStub.undeployActiveEventReceiverConfiguration(name);
        } catch (Exception ignore) { /* ignore */ }
    }

    public boolean addOrUpdateEventReceiver(String name, String content) throws RemoteException {
        try {
            return this.eventReceiverStub.deployEventReceiverConfiguration(content);
        } catch (Exception ignore) {
            this.eventReceiverStub.undeployActiveEventReceiverConfiguration(name);
            return this.eventReceiverStub.deployEventReceiverConfiguration(content);
        }
    }

}
