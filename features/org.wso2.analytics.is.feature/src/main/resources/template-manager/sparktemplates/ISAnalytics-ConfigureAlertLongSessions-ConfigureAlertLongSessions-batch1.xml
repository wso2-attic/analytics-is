<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Analytics>
    <CronExpression> 0 0/2 * * * ? </CronExpression>
    <Editable>true</Editable>
    <Name>ISAnalytics-ConfigureAlertLongSessions-ConfigureAlertLongSessions-batch1</Name>
    <Script>
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
        WHERE startTimestamp >= offsetInDays(-7)) temp
        GROUP BY meta_tenantId, tenantDomain, username, userstoreDomain;
    </Script>
</Analytics>
