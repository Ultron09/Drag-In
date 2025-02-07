import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const form = new formidable.IncomingForm();
    form.uploadDir = "/tmp";
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: "File upload error" });
        }

        const { username, email, password } = fields;
        const file = files.file;

        // Create a new user in Supabase Authentication
        const { data: user, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        let fileUrl = null;
        if (file) {
            // Read file and upload to Supabase Storage
            const fileBuffer = fs.readFileSync(file.filepath);
            const { data, error: uploadError } = await supabase
                .storage
                .from("user-files") // Make sure this bucket exists in Supabase Storage
                .upload(`profiles/${user.id}/${file.originalFilename}`, fileBuffer, {
                    contentType: file.mimetype,
                });

            if (uploadError) {
                return res.status(500).json({ error: "File upload failed" });
            }

            fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-files/${data.path}`;
        }

        // Insert user into the `users` table in Supabase
        const { error: dbError } = await supabase
            .from("users")
            .insert([{ id: user.id, username, email, file_url: fileUrl }]);

        if (dbError) {
            return res.status(500).json({ error: "Failed to save user data" });
        }

        res.json({ success: true, message: "Signup successful" });
    });
}
