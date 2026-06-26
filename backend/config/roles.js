const ROLES = {
    ADMIN: 'admin',
    BRANCH: 'branch',
    USER: 'user',
    AGENT: 'agent',
    CUSTOMER: 'customer'
};

const PERMISSIONS = {
    // Admin Management
    ADD_ADMIN: 'add_admin',
    DELETE_ADMIN: 'delete_admin',
    VIEW_ADMIN: 'view_admin',

    // Agent Management
    ADD_AGENT: 'add_agent',
    VIEW_AGENT: 'view_agent',
    UPDATE_AGENT: 'update_agent',
    DELETE_AGENT: 'delete_agent',

    // Customer Management
    ADD_CUSTOMER: 'add_customer',
    VIEW_CUSTOMER: 'view_customer',
    UPDATE_CUSTOMER: 'update_customer',
    DELETE_CUSTOMER: 'delete_customer',

    // Luggage
    ADD_LUGGAGE: 'add_luggage',
    UPDATE_LUGGAGE: 'update_luggage',
    VIEW_LUGGAGE: 'view_luggage',
    DELETE_LUGGAGE: 'delete_luggage',

    // Parcel
    ADD_PARCEL: 'add_parcel',
    VIEW_PARCEL: 'view_parcel',
    UPDATE_PARCEL: 'update_parcel',
    PICKUP_PARCEL: 'pickup_parcel',
    DROP_PARCEL: 'drop_parcel',
};

const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        // Admin ko sab permission
        PERMISSIONS.ADD_ADMIN,
        PERMISSIONS.DELETE_ADMIN,
        PERMISSIONS.VIEW_ADMIN,
        PERMISSIONS.ADD_AGENT,
        PERMISSIONS.VIEW_AGENT,
        PERMISSIONS.UPDATE_AGENT,
        PERMISSIONS.DELETE_AGENT,
        PERMISSIONS.ADD_CUSTOMER,
        PERMISSIONS.VIEW_CUSTOMER,
        PERMISSIONS.UPDATE_CUSTOMER,
        PERMISSIONS.DELETE_CUSTOMER,
        PERMISSIONS.ADD_LUGGAGE,
        PERMISSIONS.UPDATE_LUGGAGE,
        PERMISSIONS.VIEW_LUGGAGE,
        PERMISSIONS.DELETE_LUGGAGE,
        PERMISSIONS.ADD_PARCEL,
        PERMISSIONS.VIEW_PARCEL,
        PERMISSIONS.UPDATE_PARCEL,
        PERMISSIONS.PICKUP_PARCEL,
        PERMISSIONS.DROP_PARCEL,
    ],
    [ROLES.BRANCH]: [
        // Branch Panel - Limited access
        PERMISSIONS.ADD_CUSTOMER,
        PERMISSIONS.VIEW_CUSTOMER,
        PERMISSIONS.UPDATE_CUSTOMER,
        PERMISSIONS.ADD_AGENT,
        PERMISSIONS.VIEW_AGENT,
        PERMISSIONS.UPDATE_AGENT,
        PERMISSIONS.ADD_LUGGAGE,
        PERMISSIONS.UPDATE_LUGGAGE,
        PERMISSIONS.VIEW_LUGGAGE,
        PERMISSIONS.DELETE_LUGGAGE,
        PERMISSIONS.VIEW_PARCEL,
        PERMISSIONS.UPDATE_PARCEL,
    ],
    [ROLES.USER]: [
        // Staff User - Basic access
        PERMISSIONS.VIEW_CUSTOMER,
        PERMISSIONS.VIEW_AGENT,
        PERMISSIONS.ADD_LUGGAGE,
        PERMISSIONS.UPDATE_LUGGAGE,
        PERMISSIONS.VIEW_LUGGAGE,
        PERMISSIONS.VIEW_PARCEL,
    ],
    [ROLES.AGENT]: [
        // Agent - View & Pick/Drop
        PERMISSIONS.VIEW_PARCEL,
        PERMISSIONS.PICKUP_PARCEL,
        PERMISSIONS.DROP_PARCEL,
    ],
    [ROLES.CUSTOMER]: [
        // Customer - Own parcels only
        PERMISSIONS.ADD_PARCEL,
        PERMISSIONS.VIEW_PARCEL,
        PERMISSIONS.DROP_PARCEL,
    ]
};

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS };