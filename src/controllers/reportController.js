const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const submitReport = async (req, res) => {
    try {
        const { goalId } = req.params;
        const userId= req.userId;

        // Verify goal exists and user owns it
        const { data: goal, error: goalError } = await supabase
            .from("goals")
            .select("*")
            .eq("id", goalId)
            .eq("user_id", userId)
            .single();

        if (goalError || !goal) {
            return res.status(404).json({ error: "Goal not found or you do not have permission to report on this goal." });
        }

        // Check if a report already exists for today
        const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
        const { data: existingReport } = await supabase
            .from("reports")
            .select("*")
            .eq("goal_id", goalId)
            .gte("submitted_at", today + 'T00:00:00') // Start of today
            .lt("submitted_at", today + 'T23:59:59'); // End of today

        if (existingReport && existingReport.length > 0) {
            return res.status(400).json({ error: "You have already submitted a report for this goal today." });
        }
        
        // Create a new report
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(23, 59, 59, 0); // Set to end of the day

        const { data: reportData, error: reportError } = await supabase
            .from("reports")
            .insert([{ 
                goal_id: goalId, 
                user_id: userId,
                status: "submitted",
                submitted_at: new Date().toISOString(), 
                due_date: dueDate.toISOString() 
            }])
            .select();

            if (reportError) throw reportError;

            // Update goal's last_reported_at
            await supabase
            .from("goals")
            .update({ last_reported_at: new Date().toISOString() })
            .eq("id", goalId);

        res.status(201).json({ message: "Report submitted successfully", report: reportData[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getReports = async (req, res) => {
    try {
        const { goalId } = req.params;
        const userId = req.userId;

        // Verify ownership
        const { data: goal } = await supabase
            .from("goals")
            .select("*")
            .eq("id", goalId)
            .eq("user_id", userId)
            .single();

        if (!goal) {
            return res.status(404).json({ error: "Goal not found or you do not have permission to view reports for this goal." });
        }

        const { data, error } = await supabase
            .from("reports")
            .select("*")
            .eq("goal_id", goalId)
            .order("submitted_at", { ascending: false });

        if (error) throw error;

        res.json({ reports: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllReports = async (req, res) => {
    try {
        const userId = req.userId;

        const { data, error } = await supabase
            .from("reports")
            .select("*")
            .eq("user_id", userId)
            .order("submitted_at", { ascending: false });
        
        if (error) throw error;

        res.json({ reports: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { submitReport, getReports, getAllReports };