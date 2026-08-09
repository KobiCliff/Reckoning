const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const createGoal = async (req, res) => {
    try {
        const { name,frequency, stake_amount } = req.body;
        const userId = req.userId;

        if (!name || !frequency || !stake_amount) {
            return res.status(400).json({ error: 'Name, frequency, and stake amount are required' });
        }

        const { data, error } = await supabase
        .from('goals')
        .insert([{ user_id: userId, name, frequency, stake_amount, status: 'active' }])
        .select();

        if (error) throw error;

        res.status(201).json({ message: 'Goal created successfully', goal: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const listGoals = async (req, res) => {
    try {
        const userId = req.userId;

        const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ goals: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const userId = req.userId;

        const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ goal: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const userId = req.userId;
        const { status, name, frequency, stake_amount } = req.body;

        const { data: goal, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

        if (fetchError || !goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (name) updateData.name = name;
        if (frequency) updateData.frequency = frequency;
        if (status === 'completed') updateData.completed_at = new Date();

        const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goalId)
        .select();

        if (error) throw error;

        res.json({ message: 'Goal updated successfully', goal: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const userId = req.userId;

        // Verify ownership
        const { data: goal, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

        if (fetchError || !goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

        if (error) throw error;

        res.json({ message: 'Goal deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createGoal, listGoals, getGoal, updateGoal, deleteGoal };