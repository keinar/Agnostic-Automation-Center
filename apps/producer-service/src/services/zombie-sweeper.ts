import { Db, ObjectId } from 'mongodb';

export class ZombieSweeperService {
    private static intervalId?: NodeJS.Timeout;
    private static readonly SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    private static readonly IDLE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

    public static start(db: Db) {
        if (this.intervalId) return;

        console.log('[ZombieSweeper] Initializing heartbeat sweeper interval...');

        this.intervalId = setInterval(() => {
            this.sweep(db).catch(err => {
                console.error('[ZombieSweeper] Error during zombie sweep:', err);
            });
        }, this.SWEEP_INTERVAL_MS);
        
        // Initial run
        this.sweep(db).catch(console.error);
    }

    public static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            console.log('[ZombieSweeper] Stopped heartbeat sweeper.');
        }
    }

    private static async sweep(db: Db) {
        const threshold = new Date(Date.now() - this.IDLE_THRESHOLD_MS);
        const executions = db.collection('executions');

        // Find stuck executions
        const frozenExecutions = await executions.find({
            status: 'RUNNING',
            updatedAt: { $lt: threshold }
        }).toArray();

        if (frozenExecutions.length === 0) {
            return;
        }

        console.log(`[ZombieSweeper] Found ${frozenExecutions.length} frozen executions without recent heartbeat (older than 15 mins).`);

        for (const exe of frozenExecutions) {
            const now = new Date();
            const timeoutMessage = '\n\n[SYSTEM] Execution timed out due to inactivity. No logs or updates were received for 15 minutes. The external CI container likely crashed unexpectedly.';
            
            const output = (exe.output || '') + timeoutMessage;

            // 1. Mark Execution as ERROR
            await executions.updateOne(
                { _id: exe._id },
                {
                    $set: {
                        status: 'ERROR',
                        endTime: now,
                        output: output,
                        updatedAt: now
                    }
                }
            ).catch(err => console.error(`[ZombieSweeper] Failed to update execution ${exe.taskId}:`, err));
            
            // 2. Mark corresponding test cycle item as FAILED if cycleId exists
            if (exe.cycleId && exe.cycleItemId && exe.organizationId) {
                const cycles = db.collection('test_cycles');
                let cycleObjectId: ObjectId;
                try {
                    cycleObjectId = typeof exe.cycleId === 'string' ? new ObjectId(exe.cycleId) : exe.cycleId;
                    await cycles.updateOne(
                        { _id: cycleObjectId, organizationId: exe.organizationId },
                        {
                            $set: {
                                'items.$[elem].status': 'FAILED',
                                status: 'COMPLETED'
                            }
                        },
                        { arrayFilters: [{ 'elem.id': exe.cycleItemId }] }
                    ).catch(err => console.error(`[ZombieSweeper] Failed to update cycle for ${exe.taskId}:`, err));
                } catch (e) {
                    console.error(`[ZombieSweeper] Invalid cycleId formatting for execution ${exe.taskId}`);
                }
            }
            
            // 3. Update Ingest Session if one exists
            if (exe.taskId) {
                await db.collection('ingest_sessions').updateMany(
                    { taskId: exe.taskId },
                    {
                        $set: {
                            status: 'FAILED',
                            endTime: now
                        }
                    }
                ).catch(() => {});
            }
            
            console.log(`[ZombieSweeper] Swept execution ${exe.taskId} (marked as ERROR)`);
        }
    }
}
