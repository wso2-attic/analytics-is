var configs = [{
        name: TYPE_LANDING,
        type: 11,
        columns: [
            { name: "contextId", label: "Context ID", type: "ordinal" },
            { name: "userName", label: "User Name", type: "ordinal" },
            { name: "serviceProvider", label: "Service Provider", type: "ordinal" },
            { name: "identityProvider", label: "Identity Provider", type: "ordinal" },
            { name: "rolesCommaSeperated", label: "Roles", type: "ordinal" },
            { name: "tenantDomain", label: "Tenant Domain", type: "ordinal"},
            { name: "remoteIp", label: "IP", type: "ordinal" },
            { name: "region", label: "Region", type: "ordinal" },
            { name: "authStepSuccess", label: "Authentication Step Success", type: "ordinal" },
            { name: "authenticationSuccess", label: "Overall Authentication", type: "ordinal" },
            { name: "_timestamp", label: "Timestamp", type: "ordinal" }
        ]
    },
    {
        name: TYPE_RESIDENT_IDP,
        type: 20,
        columns: [
            { name: "contextId", label: "Context ID", type: "ordinal" },
            { name: "userName", label: "User Name", type: "ordinal" },
            { name: "serviceProvider", label: "Service Provider", type: "ordinal" },
            { name: "userstore", label: "Userstore", type: "ordinal" },
            { name: "tenantDomain", label: "Tenant Domain", type: "ordinal"},
            { name: "rolesCommaSeperated", label: "Roles", type: "ordinal" },
            { name: "remoteIp", label: "IP", type: "ordinal" },
            { name: "region", label: "Region", type: "ordinal" },
            { name: "authStepSuccess", label: "Authentication Step Success", type: "ordinal" },
            { name: "authenticationSuccess", label: "Overall Authentication", type: "ordinal" },
            { name: "_timestamp", label: "Timestamp", type: "ordinal" }
        ]
    },
    {
        name: TYPE_SESSIONS,
        type: 27,
        columns: [
            { name: "sessionId", label: "Session ID", type: "ordinal" },
            { name: "userName", label: "Username", type: "ordinal" },
            { name: "startTimestamp", label: "Start Time", type: "ordinal" },
            { name: "terminationTimestamp", label: "Termination Time", type: "ordinal" },
            { name: "endTimestamp", label: "End Time", type: "ordinal" },
            { name: "duration", label: "Duration", type: "ordinal" },
            { name: "isActive", label: "Is Active", type: "ordinal" },
            { name: "userstoreDomain", label: "Userstore Domain", type: "ordinal" },
            { name: "tenantDomain", label: "Tenant Domain", type: "ordinal" },
            { name: "IP", label: "IP", type: "ordinal" },
            { name: "rememberMeFlag", label: "Remember Me Flag", type: "ordinal" },
            { name: "_timestamp", label: "Timestamp", type: "ordinal" }
        ]
    }    
];