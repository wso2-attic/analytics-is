<?xml version="1.0" encoding="UTF-8"?>
<!--
  ~ Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
  ~
  ~ Licensed under the Apache License, Version 2.0 (the "License");
  ~ you may not use this file except in compliance with the License.
  ~ You may obtain a copy of the License at
  ~
  ~     http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing, software
  ~ distributed under the License is distributed on an "AS IS" BASIS,
  ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  ~ See the License for the specific language governing permissions and
  ~ limitations under the License.
  -->
<domain name="ISAnalytics">
    <description>Real-time and batch IS Analytics.</description>
    <scenarios>
        <scenario type="ConfigureAlertLongSessions">
            <description>Configure long session duration detection</description>

            <templates>
                <template type="batch">
                    <executionParameters>
                    <cron>0 0/2 * * * ?</cron>

                    <sparkScript>
                    	<![CDATA[
                    	CREATE TEMPORARY TABLE rawSessionsTable USING CarbonAnalytics OPTIONS (tableName
                    	"ORG_WSO2_IS_ANALYTICS_STREAM_SESSIONINFO", schema "meta_tenantId INT -i -f, sessionId STRING -i -f,
                    	startTimestamp LONG -i, renewTimestamp LONG -i, terminationTimestamp LONG -i, endTimestamp LONG -i, year INT,
                    	month INT, day INT, hour INT, minute INT, duration LONG -f -sp, isActive BOOLEAN -i -f, username STRING -i -f,
                    	userstoreDomain STRING -i -f, remoteIp STRING -i -f, region STRING -i, tenantDomain STRING -i -f,
                    	serviceProvider STRING -i -f, identityProviders STRING -i -f, rememberMeFlag BOOLEAN -i -f, userAgent STRING -i
                    	-f, usernameWithTenantDomainAndUserstoreDomain STRING -i -f", primaryKeys "meta_tenantId,
                    	sessionId", mergeSchema "false");

                    	CREATE TEMPORARY TABLE averageSessionDurationTable USING CarbonAnalytics OPTIONS (tableName
                    	"ORG_WSO2_IS_ANALYTICS_STREAM_AVERAGESESSIONDURATION", schema "meta_tenantId INT -i -f, tenantDomain STRING -i
                    	-f, username STRING -i -f, userstoreDomain STRING -i -f, avgDuration DOUBLE -i -f", primaryKeys "meta_tenantId,
                    	tenantDomain, username, userstoreDomain", mergeSchema "false");

                    	INSERT INTO TABLE averageSessionDurationTable 
                    	SELECT temp.meta_tenantId, temp.tenantDomain, temp.username, temp.userstoreDomain, AVG(temp.duration) as avgDuration
                    	FROM
                    	(SELECT meta_tenantId, tenantDomain, username, userstoreDomain, duration
                    	FROM rawSessionsTable
                    	WHERE startTimestamp >= offsetInDays(-$numberOfDays)) temp
                    	GROUP BY meta_tenantId, tenantDomain, username, userstoreDomain;
                    	]]>
                    </sparkScript>

                    </executionParameters>
                </template>

                <template type="realtime">
                	<![CDATA[
                        /* Enter a unique ExecutionPlan */
                        @Plan:name('ISAnalytics-RealtimeAlerts-LongSessions')

                        /* Enter a unique description for ExecutionPlan */
                        @Plan:description('Detects long session durations and alerts the user')

                        /* define streams/tables and write queries here ... */

                        @Export('org.wso2.is.analytics.stream.LongSessions:1.0.0')
                        define stream AlertLongSessions (meta_tenantId int, tenantDomain string, sessionId string, username string, duration long, avgDuration double);

                        @Export('org.wso2.is.analytics.allISAlertsStream:1.0.0')
                        define stream alert_allISAlertsStream (meta_tenantId int, type string, tenantDomain string, msg string, severity int, alertTimestamp long, userReadableTime string);

                        @from(eventtable = 'analytics.table' , table.name = 'ORG_WSO2_IS_ANALYTICS_STREAM_AVERAGESESSIONDURATION', primary.keys = 'meta_tenantId, tenantDomain, username, userstoreDomain', indices = 'meta_tenantId, tenantDomain, username, userstoreDomain, avgDuration', wait.for.indexing = 'true', merge.schema = 'false')
                        define table AverageSessionDurationTable(meta_tenantId int, tenantDomain string, username string, userstoreDomain string, avgDuration double);

                        @from(eventtable = 'analytics.table' , table.name = 'ORG_WSO2_IS_ANALYTICS_STREAM_SESSIONINFO')
                        define table SessionStreamInfoTable(meta_tenantId int, sessionId string, startTimestamp long, renewTimestamp long, terminationTimestamp long, endTimestamp long, year int, month int, day int, hour int, minute int, duration long, isActive bool, username string, userstoreDomain string, remoteIp string, region string, tenantDomain string, serviceProvider string, identityProviders string, rememberMeFlag bool, userAgent string, usernameWithTenantDomainAndUserstoreDomain string);

                        define trigger periodicalTriggerStream at every 2 min;

                        @info(name = 'getDataFromSessionStreamInfoTable')
                        from periodicalTriggerStream join SessionStreamInfoTable
                        select *
                        insert into SessionStreamInfoSummary;

                        @info(name = 'FilterLongSessions')
                        from SessionStreamInfoSummary [duration > $sessionDurationThreshold and rememberMeFlag == false and isActive == true]
                        select meta_tenantId, sessionId, startTimestamp, renewTimestamp, terminationTimestamp, endTimestamp, duration, username, userstoreDomain, tenantDomain
                        insert into FilterLongSessions;

                        @info(name = 'getDataFromAverageSessionDurationTable')
                        from FilterLongSessions as s join AverageSessionDurationTable as t
                        on (s.meta_tenantId == t.meta_tenantId and s.tenantDomain == t.tenantDomain and s.username == t.username and s.userstoreDomain == t.userstoreDomain)
                        select s.meta_tenantId, s.tenantDomain, s.sessionId, s.username, s.duration, t.avgDuration
                        insert into AlertLongSessionsTemp;

                        @info(name = 'DetectAbnormalLongSessions')
                        from AlertLongSessionsTemp[duration > (avgDuration * ($avgPercentageThreshold + 100.0) / 100.0)]
                        select meta_tenantId, tenantDomain, sessionId, username, duration, avgDuration
                        insert into AlertLongSessions;

                        @info(name = 'SendingAlertsToAllISAlertsStream')
                        from AlertLongSessions
                        select meta_tenantId, "AbnormalLongSessionAlert" as type, tenantDomain, str:concat('Abnormal long session session of ', duration, ' milliseconds detected by user: ', username,' on session id: ', sessionId, '.') as msg, 3 as severity, (time:timestampInMilliseconds()) as alertTimestamp, time:dateFormat((time:timestampInMilliseconds()),'yyyy-MM-dd HH:mm:ss') as userReadableTime
                        insert into alert_allISAlertsStream;
                	]]>
                </template>
            </templates>
            <parameters>
                <parameter name="sessionDurationThreshold" type="long">
                    <displayName>Session Duration Threshold Value (Milliseconds)</displayName>
                    <description>Threshold value to filter long duration sessions</description>
                    <defaultValue>900000</defaultValue>
                </parameter>
                <parameter name="avgPercentageThreshold" type="double">
                    <displayName>Session Duration Threshold Percentage</displayName>
                    <description>Threshold value to filter long duration sessions</description>
                    <defaultValue>50.0</defaultValue>
                </parameter>
                <parameter name="numberOfDays" type="int">
                    <displayName>Number of days</displayName>
                    <description>Number of days to be considered when calculating average</description>
                    <defaultValue>7</defaultValue>
                </parameter>
            </parameters>
        </scenario>

        <scenario type="ConfigureSuspiciousLoginDetection">
            <description>Configure suspicious login success detection</description>
            <templates>
                <template type="realtime">
                    <![CDATA[
                        /* Enter a unique ExecutionPlan */
                        @Plan:name('IsAnalytics-ExecutionPlan-LoginSuccessAfterMultipleFailures')

                        /* Enter a unique description for ExecutionPlan */
                        -- @Plan:description('ExecutionPlan')

                        /* define streams/tables and write queries here ... */
                        @Import('org.wso2.is.analytics.stream.OverallAuthentication:1.0.0')
                        define stream AuthStream (meta_tenantId int, contextId string, eventId string, eventType string, authenticationSuccess bool, username string, localUsername string, userStoreDomain string, tenantDomain string, remoteIp string, region string, inboundAuthType string, serviceProvider string, rememberMeEnabled bool, forceAuthEnabled bool, passiveAuthEnabled bool, rolesCommaSeparated string, authenticationStep string, identityProvider string, authStepSuccess bool, stepAuthenticator string, isFirstLogin bool, identityProviderType string, _timestamp long);

                        @Export('org.wso2.is.analytics.stream.LoginSuccessAfterMultipleFailures:1.0.0')
                        define stream LoginAlertStream (meta_tenantId int, username string, severity int, msg string, tenantDomain string, _timestamp long);

                        @Export('org.wso2.is.analytics.allISAlertsStream:1.0.0')
                        define stream alert_allISAlertsStream (meta_tenantId int, type string, tenantDomain string, msg string, severity int, alertTimestamp long, userReadableTime string);

                        /* Query for detecting login attempts with same username*/
                        @info(name = 'detectEventsForSameUser')
                        from every(e1=AuthStream) -> e2=AuthStream[authStepSuccess == false AND e1.username == e2.username AND e1.userStoreDomain == e2.userStoreDomain AND e1.tenantDomain == e2.tenantDomain]<$minLoginFailures:> ->  e3=AuthStream[authStepSuccess == true AND e2.username == e3.username AND e2.userStoreDomain == e3.userStoreDomain AND e2.tenantDomain == e3.tenantDomain]
                        within $timeDuration min
                        select e2[last].meta_tenantId, e2[last].username, 1 as severity, str:concat('Successful login attempt after multiple login failures with same username detected at: ', time:dateFormat(e3[last]._timestamp,'yyyy-MM-dd HH:mm:ss'), '.') as msg, e2[last].tenantDomain, e3[last]._timestamp, e2[last].serviceProvider
                        output first every $timeDuration min
                        insert into LoginAlertStreamSameUsername;

                        @info(name = 'sendingSameUserEventsToLoginAlertStream')
                        from LoginAlertStreamSameUsername
                        select meta_tenantId, username, severity, msg, tenantDomain, _timestamp
                        insert into LoginAlertStream;

                        @info(name = 'sendingSameUserEventsToAllISAlertsStream')
                        from LoginAlertStreamSameUsername
                        select meta_tenantId, "SuspiciousLoginAlert" as type, tenantDomain, str:concat('Successful login attempt after multiple login failures from same username: ', username, ' using ', serviceProvider, ' serviceProvider detected at: ', time:dateFormat(e3[last]._timestamp,'yyyy-MM-dd HH:mm:ss'), '.') as msg, severity, (time:timestampInMilliseconds()) as alertTimestamp, (time:dateFormat((time:timestampInMilliseconds()),'yyyy-MM-dd HH:mm:ss')) as userReadableTime
                        insert into alert_allISAlertsStream;
                    ]]>
                </template>
            </templates>
            <parameters>
                <parameter name="minLoginFailures" type="int">
                    <displayName>Minimum Login Failures</displayName>
                    <description>Minimum number of login failures (which is followed by a successful login) to detect suspicious login.</description>
                    <defaultValue>5</defaultValue>
                </parameter>

                <parameter name="timeDuration" type="int">
                    <displayName>Time Duration</displayName>
                    <description>Time duration(in minutes) within which the sequence of login failures followed by success event occurring.</description>
                    <defaultValue>1</defaultValue>
                </parameter>
            </parameters>
        </scenario>

    </scenarios>
</domain>

