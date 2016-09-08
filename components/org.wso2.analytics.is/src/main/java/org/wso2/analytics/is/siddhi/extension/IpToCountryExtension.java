/*
 * Copyright (c)  2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
 *
 */

package org.wso2.analytics.is.siddhi.extension;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.analytics.shared.geolocation.exception.GeoLocationResolverException;
import org.wso2.carbon.analytics.shared.geolocation.impl.GeoLocationResolverUDFWithImprovedCache;
import org.wso2.siddhi.core.config.ExecutionPlanContext;
import org.wso2.siddhi.core.executor.ExpressionExecutor;
import org.wso2.siddhi.core.executor.function.FunctionExecutor;
import org.wso2.siddhi.query.api.definition.Attribute;

public class IpToCountryExtension extends FunctionExecutor {

    private static final Log log = LogFactory.getLog(IpToCountryExtension.class);
    private GeoLocationResolverUDFWithImprovedCache geoLocationResolverUDF = new GeoLocationResolverUDFWithImprovedCache();

    @Override
    protected void init(ExpressionExecutor[] expressionExecutors, ExecutionPlanContext executionPlanContext) {
    }

    @Override
    protected Object execute(Object[] objects) {
        return null;
    }

    @Override
    protected Object execute(Object o) {
        try {
            return geoLocationResolverUDF.getCountry(o.toString());
        } catch (GeoLocationResolverException e) {
            log.error("Exception when resolving the country for given IP : " + o.toString(), e);
            return "";
        }
    }

    @Override
    public void start() {

    }

    @Override
    public void stop() {

    }

    @Override
    public Attribute.Type getReturnType() {
        return Attribute.Type.STRING;
    }

    @Override
    public Object[] currentState() {
        return new Object[0];
    }

    @Override
    public void restoreState(Object[] objects) {

    }
}