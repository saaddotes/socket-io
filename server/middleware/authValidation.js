export default function checkCredentials(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and Password required" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must greater then 6 characters",
    });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Email Format" });
  }

  next();
}
