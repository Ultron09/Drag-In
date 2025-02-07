import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { username, email, password } = req.body;

    // Create a new user in Supabase Authentication
    const { data: user, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        return res.status(400).json({ error: authError.message });
    }

    // Insert user into Supabase database
    const { error: dbError } = await supabase
        .from("users")
        .insert([{ id: user.id, username, email }]);

    if (dbError) {
        return res.status(500).json({ error: "Failed to save user data" });
    }

    res.json({ success: true, message: "Signup successful" });
}
