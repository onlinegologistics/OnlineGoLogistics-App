const { ROLE_PERMISSIONS } = require('../config/roles');

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        
        if (!userRole) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userPermissions = ROLE_PERMISSIONS[userRole];

        if (!userPermissions || !userPermissions.includes(requiredPermission)) {
            return res.status(403).json({ 
                message: 'Forbidden - You do not have permission for this action' 
            });
        }

        next();
    };
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: 'Forbidden - Your role does not have access' 
            });
        }

        next();
    };
};

module.exports = { checkPermission, checkRole };