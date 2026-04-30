const loggerEvent = require("../services/logger.service");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const logger = loggerEvent("auth");

const authentication = async (req, res, next) => {
  try {
    let token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      token = req.cookies?.access_token;
    }

    if (!token) {
      return res.status(401).send({ message: "❌ Unauthenticated user" });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(401).send({ message: "❌ Unauthenticated user" });
    }

    if (!Array.isArray(user.tokens) || !user.tokens.includes(token)) {
      return res.status(401).send({ message: "❌ Unauthenticated user" });
    }

    req.userDoc = user;

    const userData = user.toObject();
    delete userData.password;
    delete userData.tokens;

    req.user = userData;
    req.token = token;
    next();
  } catch (error) {
    logger.error(error.message);
    return res.status(401).send({ message: "❌ Unauthenticated user" });
  }
};

// 🔒 Admin فقط
const adminAuthorized = (req, res, next) => {
  const roles = req.user?.role;
  if (!Array.isArray(roles) || !roles.includes("admin")) {
    return res.status(403).send({ message: "❌ Unauthorized: admin access required" });
  }
  next();
};

// 🔒 Doctor فقط
const doctorAuthorized = (req, res, next) => {
  const roles = req.user?.role;
  if (!Array.isArray(roles) || !roles.includes("doctor")) {
    return res.status(403).send({ message: "❌ Unauthorized: doctor access required" });
  }
  next();
};

// 🔒 Nurse فقط
const nurseAuthorized = (req, res, next) => {
  const roles = req.user?.role;
  if (!Array.isArray(roles) || !roles.includes("nurse")) {
    return res.status(403).send({ message: "❌ Unauthorized: nurse access required" });
  }
  next();
};

// 🔒 Doctor أو Admin
const doctorOrAdminAuthorized = (req, res, next) => {
  const roles = req.user?.role;
  if (!Array.isArray(roles) || (!roles.includes("doctor") && !roles.includes("admin"))) {
    return res.status(403).send({ message: "❌ Unauthorized: doctor or admin access required" });
  }
  next();
};

// 🔒 Doctor أو Nurse
const doctorOrNurseAuthorized = (req, res, next) => {
  const roles = req.user?.role;
  if (!Array.isArray(roles) || (!roles.includes("doctor") && !roles.includes("nurse"))) {
    return res.status(403).send({ message: "❌ Unauthorized: doctor or nurse access required" });
  }
  next();
};

// 🔒 Doctor أو Nurse أو Admin
const doctorNurseOrAdminAuthorized = (req, res, next) => {
  const roles = req.user?.role;
  if (!Array.isArray(roles) || (!roles.includes("doctor") && !roles.includes("nurse") && !roles.includes("admin"))) {
    return res.status(403).send({ message: "❌ Unauthorized: doctor, nurse or admin access required" });
  }
  next();
};

module.exports = { 
  authentication, 
  adminAuthorized,
  doctorAuthorized,
  nurseAuthorized,
  doctorOrAdminAuthorized,
  doctorOrNurseAuthorized,
  doctorNurseOrAdminAuthorized
};