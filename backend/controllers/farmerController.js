const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Farmer = require("../models/farmerModel");
const { clean, validateRegistration } = require("../utils/validate");

const makeToken = (id) =>
    jwt.sign({ id, role: "farmer" }, process.env.JWT_SECRET, { expiresIn: "1d" });

const registerFarmer = async (req, res) => {
    const { name, email, phone, password, address } = req.body;

    const error = validateRegistration({ name, email, phone, password });
    if (error) return res.status(400).json({ message: error });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const farmerId = await Farmer.createFarmer({
            name: clean(name),
            email: clean(email).toLowerCase(),
            phone: clean(phone),
            password: hashedPassword,
            address: clean(address) || null
        });

        res.status(201).json({ message: "Farmer registered successfully", farmerId });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This email is already registered" });
        }
        throw err;
    }
};

const loginFarmer = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please enter email and password" });
    }

    const farmer = await Farmer.findFarmerByEmail(clean(email).toLowerCase());

    // Same message for both cases so emails can't be guessed
    if (!farmer || !(await bcrypt.compare(password, farmer.password))) {
        return res.status(401).json({ message: "Incorrect email or password" });
    }

    res.json({
        message: "Login successful",
        token: makeToken(farmer.farmer_id),
        user: {
            id: farmer.farmer_id,
            name: farmer.name,
            email: farmer.email,
            role: "farmer"
        }
    });
};

const getProfile = async (req, res) => {
    const farmer = await Farmer.getFarmerById(req.user.id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    res.json(farmer);
};

module.exports = { registerFarmer, loginFarmer, getProfile };
