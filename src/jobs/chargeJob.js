const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Run daily at midnight
const startChargeJob = () => {
    cron.schedule('0 0 * * *', async() => {
        console.log('Running daily charge job...');

        try {
            // Get all active goals
            const { data: goals, error: goalsError } = await supabase
                .from('goals')
                .select('*')
                .eq('status', 'active');

            if (goalsError) throw goalsError;

            for (const goal of goals) {
                const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

                // Check if a report exists today
                const { data: reports } = await supabase
                    .from('reports')
                    .select('*')
                    .eq('goal_id', goal.id)
                    .gte('submitted_at', today + 'T00:00:00') // Start of today
                    .lt('submitted_at', today + 'T23:59:59'); // End of today

                // If no report exists, create a charge
                if (!reports || reports.length === 0) {
                    const { data: chargeData, error: chargeError } = await supabase
                        .from('charges')
                        .insert([{
                            goal_id: goal.id,
                            user_id: goal.user_id,
                            amount: goal.stake_amount,
                            reason: 'Missed daily report',
                            status: 'pending'
                        }])
                        .select();

                    if (chargeData && chargeData.length > 0) {
                        const chargeId = chargeData[0].id;

                        // Get wallet
                        const { data: wallet } = await supabase
                            .from('wallets')
                            .select('*')
                            .eq('user_id', goal.user_id)
                            .single();

                        if (wallet && parseFloat(wallet.balance) >= parseFloat(goal.stake_amount)) {
                            // Process charge
                            const newBalance = parseFloat(wallet.balance) - parseFloat(goal.stake_amount);
                            const newChargedTotal = parseFloat(wallet.total_charged) + parseFloat(goal.stake_amount);

                            await supabase
                                .from('charges')
                                .update({ status: 'processed', charged_at: new Date().toISOString() })
                                .eq('id', chargeId);

                            console.log(`Charge ${chargeId} processed for goal ${goal.id}`);
                        } else {
                            // Mark as failed due to insufficient balance
                            await supabase
                                .from('charges')
                                .update({ status: 'failed' })
                                .eq('id', chargeId);

                            console.log(`Charge ${chargeId} failed for goal ${goal.id} due to insufficient balance`);
                        }
                    }
                }
            }

            console.log('Daily charge job completed.');
        } catch (err) {
            console.error('Error running daily charge job:', err.message);
        }
    });
};

module.exports = { startChargeJob };