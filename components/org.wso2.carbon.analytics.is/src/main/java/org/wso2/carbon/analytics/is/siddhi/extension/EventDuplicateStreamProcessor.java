/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.carbon.analytics.is.siddhi.extension;

import org.wso2.siddhi.core.config.ExecutionPlanContext;
import org.wso2.siddhi.core.event.ComplexEventChunk;
import org.wso2.siddhi.core.event.stream.StreamEvent;
import org.wso2.siddhi.core.event.stream.StreamEventCloner;
import org.wso2.siddhi.core.event.stream.populater.ComplexEventPopulater;
import org.wso2.siddhi.core.executor.ConstantExpressionExecutor;
import org.wso2.siddhi.core.executor.ExpressionExecutor;
import org.wso2.siddhi.core.executor.VariableExpressionExecutor;
import org.wso2.siddhi.core.query.processor.Processor;
import org.wso2.siddhi.core.query.processor.stream.StreamProcessor;
import org.wso2.siddhi.query.api.definition.AbstractDefinition;
import org.wso2.siddhi.query.api.definition.Attribute;
import org.wso2.siddhi.query.api.exception.ExecutionPlanValidationException;

import java.util.ArrayList;
import java.util.List;

public class EventDuplicateStreamProcessor extends StreamProcessor {
    private VariableExpressionExecutor expressionExecutor;
    private String delimiter = ",";

    @Override
    protected List<Attribute> init(AbstractDefinition inputDefinition,
            ExpressionExecutor[] attributeExpressionExecutors, ExecutionPlanContext executionPlanContext) {
        this.executionPlanContext = executionPlanContext;

        if (attributeExpressionExecutors.length == 1) {
            if (attributeExpressionExecutors[0] instanceof VariableExpressionExecutor) {
                if (attributeExpressionExecutors[0].getReturnType() == Attribute.Type.STRING) {
                    expressionExecutor = (VariableExpressionExecutor) attributeExpressionExecutors[0];

                } else {
                    throw new ExecutionPlanValidationException(" Event Duplicate stream Processor 1st parameter " +
                            "attribute should be " + "String, but found " + attributeExpressionExecutors[0]
                            .getReturnType());
                }
            } else {
                throw new ExecutionPlanValidationException(
                        "Event duplicate stream Processor 1st parameter needs to be dynamic variable but found a" +
                                " constant attribute "
                                + attributeExpressionExecutors[0].getClass().getCanonicalName());
            }
        } else if (attributeExpressionExecutors.length == 2) {

            if (attributeExpressionExecutors[0] instanceof VariableExpressionExecutor) {
                if (attributeExpressionExecutors[0].getReturnType() == Attribute.Type.STRING) {
                    expressionExecutor = (VariableExpressionExecutor) attributeExpressionExecutors[0];

                } else {
                    throw new ExecutionPlanValidationException(" Event Duplicate stream Processor 1st parameter " +
                            "attribute should be " + "String, but found " + attributeExpressionExecutors[0]
                            .getReturnType());
                }
            } else {
                throw new ExecutionPlanValidationException(
                        "Event duplicate stream Processor 1st parameter needs to be dynamic variable but found a" +
                                " constant attribute "
                                + attributeExpressionExecutors[0].getClass().getCanonicalName());
            }

            if (attributeExpressionExecutors[1] instanceof ConstantExpressionExecutor) {

                if (attributeExpressionExecutors[1].getReturnType() == Attribute.Type.STRING) {
                    delimiter = (String) ((ConstantExpressionExecutor) attributeExpressionExecutors[1]).getValue();

                } else {
                    throw new ExecutionPlanValidationException("Event duplicate stream Processor 2nd parameter " +
                            "attribute should be string, but found " + attributeExpressionExecutors[1].getReturnType());
                }

            } else {
                throw new ExecutionPlanValidationException("Event duplicate stream Processor 2nd parameter needs to " +
                        "be constant attribute but found a dynamic attribute " + attributeExpressionExecutors[1]
                        .getClass().getCanonicalName());
            }

        } else {
            throw new ExecutionPlanValidationException("Event Duplicate stream Processor should only have one/two " +
                    "parameter (<string> rolesCommaSeperated (and <string> delimiter), " +
                    "but found " + attributeExpressionExecutors.length + " input attributes");
        }

        List<Attribute> attributeList = new ArrayList<Attribute>();
        attributeList.add(new Attribute("role", Attribute.Type.STRING));
        return attributeList;
    }

    @Override
    protected void process(ComplexEventChunk<StreamEvent> streamEventChunk, Processor nextProcessor,
            StreamEventCloner streamEventCloner, ComplexEventPopulater complexEventPopulater) {

        ComplexEventChunk<StreamEvent> newStreamEventChunk = new ComplexEventChunk<StreamEvent>(false);
        synchronized (this) {
            while (streamEventChunk.hasNext()) {
                StreamEvent streamEvent = streamEventChunk.next();
                String rolesCommaSeperated = (String) expressionExecutor.execute(streamEvent);
                String[] roles = rolesCommaSeperated.split(delimiter);
                for (String role : roles) {
                    StreamEvent clonedEvent = streamEventCloner.copyStreamEvent(streamEvent);
                    complexEventPopulater.populateComplexEvent(clonedEvent, new Object[] { role });
                    newStreamEventChunk.add(clonedEvent);
                }
            }
        }

        if (newStreamEventChunk.getFirst() != null) {
            nextProcessor.process(newStreamEventChunk);
        }
    }

    @Override
    public void start() {
        //Do nothing
    }

    @Override
    public void stop() {
        //Do nothing
    }

    @Override
    public Object[] currentState() {
        return null;
    }

    @Override
    public void restoreState(Object[] state) {
        //not required
    }

}