module.exports.checkRole = (...allowedRoles) => {
    return (req, res, next) => {
      const role = req.user.role;
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          status: false,
          message: 'Access denied. Wallet is only available to vendors and riders.'
        });
      }
      next();
    };
  };
  
  exports.isRider = (req, res, next) => {
    if (req.user.role !== 'rider') {
      return res.status(403).json({
        status: false,
        message: 'Access restricted to riders only'
      });
    }
    next();
  };
  
  exports.isVendor = (req, res, next) => {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        status: false,
        message: 'Access restricted to vendors only'
      });
    }
    next();
  };