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

import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import org.apache.commons.lang.StringUtils;
import org.wso2.siddhi.core.config.ExecutionPlanContext;
import org.wso2.siddhi.core.event.ComplexEventChunk;
import org.wso2.siddhi.core.event.stream.StreamEvent;
import org.wso2.siddhi.core.event.stream.StreamEventCloner;
import org.wso2.siddhi.core.event.stream.populater.ComplexEventPopulater;
import org.wso2.siddhi.core.executor.ExpressionExecutor;
import org.wso2.siddhi.core.executor.VariableExpressionExecutor;
import org.wso2.siddhi.core.query.processor.Processor;
import org.wso2.siddhi.core.query.processor.stream.StreamProcessor;
import org.wso2.siddhi.query.api.definition.AbstractDefinition;
import org.wso2.siddhi.query.api.definition.Attribute;
import org.wso2.siddhi.query.api.exception.ExecutionPlanValidationException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Create duplicate events for a JSON string containing an array of maps.
 */
public class JsonFlatMapEventDuplicatorStreamProcessor extends StreamProcessor {
    private VariableExpressionExecutor expressionExecutor;

    @Override
    protected List<Attribute> init(AbstractDefinition inputDefinition,
                                   ExpressionExecutor[] attributeExpressionExecutors,
                                   ExecutionPlanContext executionPlanContext) {

        this.executionPlanContext = executionPlanContext;

        if (attributeExpressionExecutors.length == 1) {
            if (attributeExpressionExecutors[0] instanceof VariableExpressionExecutor) {
                if (attributeExpressionExecutors[0].getReturnType() == Attribute.Type.STRING) {
                    expressionExecutor = (VariableExpressionExecutor) attributeExpressionExecutors[0];
                } else {
                    throw new ExecutionPlanValidationException("Json Flat Map Event Duplicator stream Processor 1st " +
                            "attribute should be String, but found " + attributeExpressionExecutors[0].getReturnType());
                }
            } else {
                throw new ExecutionPlanValidationException("Event duplicate stream Processor 1st parameter " +
                        "needs to be dynamic variable but found a constant attribute " +
                        attributeExpressionExecutors[0].getClass().getCanonicalName());
            }
        } else {
            throw new ExecutionPlanValidationException("Json Flat Map Event Duplicator stream Processor should only " +
                    "have one parameter (<string> jsonString) but found "
                    + attributeExpressionExecutors.length + " input attributes");
        }

        List<Attribute> attributeList = new ArrayList<>();
        attributeList.add(new Attribute("key", Attribute.Type.STRING));
        attributeList.add(new Attribute("value", Attribute.Type.STRING));
        return attributeList;
    }

    @Override
    protected void process(ComplexEventChunk<StreamEvent> streamEventChunk, Processor nextProcessor,
                           StreamEventCloner streamEventCloner, ComplexEventPopulater complexEventPopulater) {

        ComplexEventChunk<StreamEvent> newStreamEventChunk = new ComplexEventChunk<>(false);
        synchronized (this) {
            while (streamEventChunk.hasNext()) {
                StreamEvent streamEvent = streamEventChunk.next();
                String jsonString = (String) expressionExecutor.execute(streamEvent);
                if (StringUtils.isNotBlank(jsonString)) {
                    Map<String, String> map =
                            new Gson().fromJson(jsonString, new TypeToken<Map<String, String>>() {
                            }.getType());

                    for (Map.Entry<String, String> entry : map.entrySet()) {
                        StreamEvent clonedEvent = streamEventCloner.copyStreamEvent(streamEvent);
                        complexEventPopulater
                                .populateComplexEvent(clonedEvent, new Object[]{entry.getKey(), entry.getValue()});
                        newStreamEventChunk.add(clonedEvent);
                    }
                } else {
                    if (log.isDebugEnabled()) {
                        log.debug("Ignored creating events from empty JSON string");
                    }
                }
            }
        }

        if (newStreamEventChunk.getFirst() != null) {
            nextProcessor.process(newStreamEventChunk);
        }
    }

    @Override
    public void start() {
        // Do nothing
    }

    @Override
    public void stop() {
        // Do nothing
    }

    @Override
    public Object[] currentState() {
        return null;    // Not required
    }

    @Override
    public void restoreState(Object[] state) {
        // Not required
    }
}
