import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { publishScheduledPost } from '../services/scheduledPostPublisher.js';

const BATCH_LIMIT = 5;

let isRunning = false;

async function processScheduledPosts(): Promise<void> {
  if (isRunning) {
    console.log('[scheduledPostsCron] Skipping run – previous execution still in progress');
    return;
  }

  isRunning = true;
  try {
    const now = new Date().toISOString();

    const { data: posts, error } = await supabase
      .from('scheduled_posts')
      .select('id, organization_id, platform')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_LIMIT);

    if (error) {
      console.error('[scheduledPostsCron] Error fetching due posts:', error);
      return;
    }

    if (!posts || posts.length === 0) {
      return;
    }

    console.log(`[scheduledPostsCron] Processing ${posts.length} due post(s)`);

    for (const post of posts) {
      // Fetch org separately (same approach as Post Now) to get correct user_id
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('user_id')
        .eq('id', post.organization_id)
        .single();

      if (orgError || !org?.user_id) {
        console.error(`[scheduledPostsCron] No org/user for post ${post.id}:`, orgError?.message || 'org not found');
        continue;
      }

      try {
        await publishScheduledPost(post.id, org.user_id, post.organization_id);
        console.log(`[scheduledPostsCron] Published post ${post.id} to ${post.platform}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[scheduledPostsCron] Failed to publish post ${post.id}:`, message);
        // Continue processing remaining posts
      }
    }
  } finally {
    isRunning = false;
  }
}

export function startScheduledPostsCron(): void {
  cron.schedule('*/5 * * * *', processScheduledPosts);
  console.log('Scheduled posts cron started (runs every 5 minutes)');
}
