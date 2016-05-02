var configs = [{
        name: TYPE_LANDING,
        type: 11,
        columns: [
            { name: "userName", label: "User Name", type: "ordinal" },
            { name: "serviceprovider", label: "Service Provider", type: "ordinal" },
            { name: "identityProvider", label: "Identity Provider", type: "ordinal" },
            { name: "rolesCommaSeperated", label: "Roles", type: "ordinal" },
            { name: "remoteIp", label: "IP", type: "ordinal" },
            { name: "authenticationSuccess", label: "Authentication Success", type: "ordinal" },
            { name: "timestamp", label: "Timestamp", type: "ordinal" }
        ]
    },
    {
        name: TYPE_RESIDENT_IDP,
        type: 20,
        columns: [
            { name: "userName", label: "User Name", type: "ordinal" },
            { name: "serviceprovider", label: "Service Provider", type: "ordinal" },
            { name: "userstore", label: "Userstore", type: "ordinal" },
            { name: "rolesCommaSeperated", label: "Roles", type: "ordinal" },
            { name: "remoteIp", label: "IP", type: "ordinal" },
            { name: "authenticationSuccess", label: "Authentication Success", type: "ordinal" },
            { name: "timestamp", label: "Timestamp", type: "ordinal" }
        ]
    }
];