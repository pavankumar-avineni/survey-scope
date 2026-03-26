import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../services/authService.js";

// ✅ REGISTER
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser(
      name,
      email,
      hashedPassword,
      role || "user"
    );

    // remove password_hash from response
    const { password_hash, ...safeUser } = user;

    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (!user.password_hash) {
      return res.status(500).json({ error: "Password hash missing in DB" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET
    );

    const { password_hash, ...safeUser } = user;

    res.json({
      token,
      user: safeUser
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};