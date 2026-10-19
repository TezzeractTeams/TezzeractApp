import { supabase } from '../config/supabase.js';

export interface PublishResult {
  post: Record<string, unknown>;
  platformResponse: unknown;
}

/**
 * Publishes a scheduled post to its target platform.
 * Used by both the postNow HTTP handler and the scheduled posts cron job.
 */
export async function publishScheduledPost(
  postId: string,
  userId: string,
  orgId: string
): Promise<PublishResult> {
  // Get scheduled post
  const { data: post, error: postError } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('id', postId)
    .eq('organization_id', orgId)
    .single();

  if (postError || !post) {
    throw new Error('Scheduled post not found');
  }

  // Get platform connection (not required for LinkedIn - uses Unipile env vars)
  const platformIdMap: Record<string, string> = {
    twitter: 'twitter',
    facebook: 'meta',
    instagram: 'meta',
    linkedin: 'linkedin',
    youtube: 'youtube',
  };

  const platformId = platformIdMap[post.platform] || post.platform;
  let connection: { access_token?: string; metadata?: Record<string, unknown> } | null = null;

  if (post.platform !== 'linkedin') {
    const { data: conn } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform_id', platformId)
      .single();
    connection = conn;

    if (!connection || !connection.access_token) {
      // Mark as failed so cron doesn't retry every minute
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('organization_id', orgId);
      throw new Error(`Platform ${post.platform} is not connected. Please connect it first.`);
    }
  }

  try {
    let postResult: unknown;

    switch (post.platform) {
      case 'twitter':
        const twitterResponse = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection!.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: post.content,
          }),
        });

        if (!twitterResponse.ok) {
          const errorData = await twitterResponse.text();
          throw new Error(`Twitter API error: ${errorData}`);
        }

        postResult = await twitterResponse.json();
        break;

      case 'facebook':
        const fbResponse = await fetch(`https://graph.facebook.com/v18.0/me/feed`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection!.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: post.content,
          }),
        });

        if (!fbResponse.ok) {
          const errorData = await fbResponse.text();
          throw new Error(`Facebook API error: ${errorData}`);
        }

        postResult = await fbResponse.json();
        break;

      case 'instagram':
        throw new Error(
          'Instagram posting requires media. Please use the Instagram API with media upload.'
        );

      case 'linkedin': {
        const unipileApiKey = process.env.UNIPILE_API_KEY;
        const unipileDsn = process.env.UNIPILE_DSN_KEY?.trim();
        const accountId = process.env.LINKEDIN_ACCOUNT_ID;
        const linkedInOrgId = process.env.LINKEDIN_ORG_ID;

        if (!unipileApiKey || !unipileDsn || !accountId || !linkedInOrgId) {
          throw new Error(
            'LinkedIn posting via Unipile is not configured. Please set UNIPILE_API_KEY, UNIPILE_DSN_KEY, LINKEDIN_ACCOUNT_ID, and LINKEDIN_ORG_ID in your environment.'
          );
        }

        const unipileUrl = `https://${unipileDsn}/api/v1/posts`;
        const formData = new FormData();
        formData.append('account_id', accountId);
        formData.append('text', post.content);
        formData.append('as_organization', linkedInOrgId);

        const unipileResponse = await fetch(unipileUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': unipileApiKey,
          },
          body: formData,
        });

        if (!unipileResponse.ok) {
          const errorData = await unipileResponse.text();
          throw new Error(`Unipile/LinkedIn API error: ${errorData}`);
        }

        postResult = await unipileResponse.json();
        break;
      }

      default:
        throw new Error(`Platform ${post.platform} is not supported for direct posting yet.`);
    }

    // Update post status to published
    const { data: updatedPost, error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating post status:', updateError);
    }

    return {
      post: updatedPost || post,
      platformResponse: postResult,
    };
  } catch (platformError: unknown) {
    // Update post status to failed
    await supabase
      .from('scheduled_posts')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('organization_id', orgId);

    const message = platformError instanceof Error ? platformError.message : 'Unknown error';
    throw new Error(`Failed to post to ${post.platform}: ${message}`);
  }
}
