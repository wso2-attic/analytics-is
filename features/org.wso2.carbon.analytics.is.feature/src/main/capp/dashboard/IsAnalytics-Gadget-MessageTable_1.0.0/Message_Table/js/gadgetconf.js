var configs = [{
        name: TYPE_OVERALL,
        type: 11,
        columns: [
            { name: "contextId", label: "Context ID", type: "ordinal" },
            { name: "username", label: "User Name", type: "ordinal" },
            { name: "serviceProvider", label: "Service Provider", type: "ordinal" },
            { name: "identityProvider", label: "Identity Provider", type: "ordinal" },
            { name: "rolesCommaSeparated", label: "Roles", type: "ordinal" },
            { name: "tenantDomain", label: "Tenant Domain", type: "ordinal"},
            { name: "remoteIp", label: "remoteIp", type: "ordinal" },
            { name: "region", label: "Region", type: "ordinal" },
            { name: "authenticationSuccess", label: "Overall Authentication", type: "ordinal" },
            { name: "_timestamp", label: "Timestamp", type: "ordinal" }
        ]
    },
    {
        name: TYPE_LOCAL,
        type: 20,
        columns: [
            { name: "contextId", label: "Context ID", type: "ordinal" },
            { name: "localUsername", label: "User Name", type: "ordinal" },
            { name: "serviceProvider", label: "Service Provider", type: "ordinal" },
            { name: "userstore", label: "Userstore", type: "ordinal" },
            { name: "tenantDomain", label: "Tenant Domain", type: "ordinal"},
            { name: "rolesCommaSeparated", label: "Roles", type: "ordinal" },
            { name: "remoteIp", label: "remoteIp", type: "ordinal" },
            { name: "region", label: "Region", type: "ordinal" },
            { name: "authenticationSuccess", label: "Local Authentication", type: "ordinal" },
            { name: "_timestamp", label: "Timestamp", type: "ordinal" }
        ]
    },
    {
        name: TYPE_FEDERATED,
        type: 21,
        columns: [
            { name: "contextId", label: "Context ID", type: "ordinal" },
            { name: "username", label: "User Name", type: "ordinal" },
            { name: "serviceProvider", label: "Service Provider", type: "ordinal" },
            { name: "identityProvider", label: "Identity Provider", type: "ordinal" },
            { name: "rolesCommaSeparated", label: "Roles", type: "ordinal" },
            { name: "remoteIp", label: "remoteIp", type: "ordinal" },
            { name: "region", label: "Region", type: "ordinal" },
            { name: "authStepSuccess", label: "Authentication Step Success", type: "ordinal" },
            { name: "_timestamp", label: "Timestamp", type: "ordinal" }
        ]
    },
    {
        name: TYPE_SESSIONS,
        type: 27,
        columns: [
            { name: "sessionId", label: "Session ID", type: "ordinal" },
            { name: "username", label: "Username", type: "ordinal" },
            { name: "startTimestamp", label: "Start Time", type: "ordinal" },
            { name: "terminationTimestamp", label: "Termination Time", type: "ordinal" },
            { name: "endTimestamp", label: "End Time", type: "ordinal" },
            { name: "duration", label: "Duration", type: "ordinal" },
            { name: "isActive", label: "Is Active", type: "ordinal" },
            { name: "userstoreDomain", label: "Userstore Domain", type: "ordinal" },
            { name: "tenantDomain", label: "Tenant Domain", type: "ordinal" },
            { name: "remoteIp", label: "remoteIp", type: "ordinal" },
            { name: "rememberMeFlag", label: "Remember Me Flag", type: "ordinal" },
            { name: "_timestamp", label: "Timestamp", type: "ordinal" }
        ]
    }    
];