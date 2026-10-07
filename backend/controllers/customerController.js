const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Customer = require("../models/customerModel");
const { clean, validateRegistration } = require("../utils/validate");

const makeToken = (id) =>
    jwt.sign({ id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1d" });

const registerCustomer = async (req, res) => {
    const { name, email, phone, password, address } = req.body;

    const error = validateRegistration({ name, email, phone, password });
    if (error) return res.status(400).json({ message: error });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const customerId = await Customer.createCustomer({
            name: clean(name),
            email: clean(email).toLowerCase(),
            phone: clean(phone),
            password: hashedPassword,
            address: clean(address) || null
        });

        res.status(201).json({ message: "Customer registered successfully", customerId });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This email is already registered" });
        }
        throw err;
    }
};

const loginCustomer = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please enter email and password" });
    }

    const customer = await Customer.findCustomerByEmail(clean(email).toLowerCase());

    if (!customer || !(await bcrypt.compare(password, customer.password))) {
        return res.status(401).json({ message: "Incorrect email or password" });
    }

    res.json({
        message: "Login successful",
        token: makeToken(customer.customer_id),
        user: {
            id: customer.customer_id,
            name: customer.name,
            email: customer.email,
            role: "customer"
        }
    });
};

const getProfile = async (req, res) => {
    const customer = await Customer.getCustomerById(req.user.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
};

module.exports = { registerCustomer, loginCustomer, getProfile };
