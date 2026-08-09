const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const getWallet = async (req, res) => {
    try {
        const userId = req.userId;
        const { data, error } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        res.json({ wallet: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deposit = async (req, res) => {
    try {
        const userId = req.userId;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Amount must be greater than 0" });
        }

        const { data: wallet, error: walletError } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (walletError) throw walletError;

        const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
        const newDeposited = parseFloat(wallet.deposited) + parseFloat(amount);

        const { data, error } = await supabase
            .from("wallets")
            .update({ balance: newBalance, total_deposited: newDeposited })
            .eq("user_id", userId)
            .select();

        if (error) throw error;

        res.json({ message: "Deposit successful", wallet: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getWallet, deposit };