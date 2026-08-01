import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

/*
=====================================
Register User
=====================================
*/

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Thanglish:
    // Empty field iruka nu check panrom

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Already account iruka?

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Password hash panrom

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    // User create panrom

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};

/*
=====================================
Login User
=====================================
*/

export const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (
      user &&
      (await bcrypt.compare(
        password,
        user.password
      ))
    ) {

      return res.json({

        _id: user._id,

        username: user.username,

        email: user.email,

        token: generateToken(user._id),

      });

    }

    res.status(401).json({
      message: "Invalid email or password",
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};