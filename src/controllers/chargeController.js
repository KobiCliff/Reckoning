const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const getCharges = async (req, res) => {
    try {
        const userId = req.userId;

        const { data, error } = await supabase
            .from("charges")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({ charges: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createCharge = async (req, res) => {
    try {
        const { goalId, amount, reason } = req.body;
        const userId = req.userId;

        if (!goalId || !amount || !reason) {
            return res.status(400).json({ error: "Goal ID, amount, and reason are required" });
        }

        // Verify goal ownership
        const { data: goal } = await supabase
            .from("goals")
            .select("*")
            .eq("id", goalId)
            .eq("user_id", userId)
            .single();

        if (!goal) {
            return res.status(404).json({ error: "Goal not found or you do not have permission to charge this goal." });
        }

        // Create charge record
        const { data: chargeData, error: chargeError } = await supabase
            .from("charges")
            .insert([{ goal_id: goalId, user_id: userId, amount, reason, status: "pending" }])
            .select();

        if (chargeError) throw chargeError;

        res.status(201).json({ message: "Charge created successfully", charge: chargeData[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const processCharge = async (req, res) => {
    try {
        const { chargeId } = req.params;
        const userId = req.userId;

        // Get charge
        const { data: charge, error: chargeError } = await supabase
            .from("charges")
            .select("*")
            .eq("id", chargeId)
            .eq("user_id", userId)
            .single();

        if (chargeError || !charge) {
            return res.status(404).json({ error: "Charge not found or you do not have permission to process this charge." });
        }

        if (charge.status !== "pending") {
            return res.status(400).json({ error: "Charge has already been processed." });
        }

        // Get wallet
        const { data: wallet } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (!wallet || parseFloat(wallet.balance) < parseFloat(charge.amount)) {
            // Mark as failed
            await supabase
                .from("charges")
                .update({ status: "failed" })
                .eq("id", chargeId);

            return res.status(400).json({ error: "Insufficient balance to process the charge." });
        }

        // Deduct from wallet
        const newBalance = parseFloat(wallet.balance) - parseFloat(charge.amount);
        const newChargedTotal = parseFloat(wallet.total_charged) + parseFloat(charge.amount);

        await supabase
            .from("wallets")
            .update({ balance: newBalance, total_charged: newChargedTotal })
            .eq("user_id", userId);

        // Mark charge as completed
        const { data, error } = await supabase
            .from("charges")
            .update({ status: "succeeded", charged_at: new Date().toISOString() })
            .eq("id", chargeId)
            .select();

        if (error) throw error;

        res.json({ message: "Charge processed successfully", charge: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getCharges, createCharge, processCharge };