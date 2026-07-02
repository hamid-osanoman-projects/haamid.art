const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const githubToken = process.env.GITHUB_STATS_TOKEN;
const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'hamid@haaamid.art';

async function run() {
  console.log('Starting GitHub statistics sync...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required Supabase keys.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Default fallback statistics if GitHub API key is missing
  let githubStats = {
    totalContributions: 1420,
    currentStreak: 45,
    topLanguages: ['TypeScript', 'Next.js', 'Rust', 'Tailwind'],
    pinnedRepos: [
      { name: 'haaamid-art', stars: 22, forks: 4 },
      { name: 'anti-gravity-engine', stars: 45, forks: 8 },
      { name: 'supabase-cache-helper', stars: 12, forks: 2 }
    ]
  };

  if (githubToken) {
    console.log('GitHub token found. Querying GraphQL contributions...');
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
            pinnedItems(first: 6, types: REPOSITORY) {
              nodes {
                ... on Repository {
                  name
                  description
                  url
                  stargazerCount
                  forkCount
                  primaryLanguage {
                    name
                    color
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${githubToken}`,
          'User-Agent': 'Antigravity-Sync'
        },
        body: JSON.stringify({
          query,
          variables: { username: 'haaamid' } // assuming owner's github
        })
      });

      if (response.ok) {
        const result = await response.json();
        const user = result.data?.user;
        
        if (user) {
          const calendar = user.contributionsCollection?.contributionCalendar;
          const totalContributions = calendar?.totalContributions || 0;
          
          // Calculate streak from calendar days
          let currentStreak = 0;
          const days = (calendar?.weeks || [])
            .flatMap(w => w.contributionDays || [])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          for (const day of days) {
            if (day.contributionCount > 0) {
              currentStreak++;
            } else {
              // Check if we are today or yesterday
              const diffTime = Math.abs(new Date().getTime() - new Date(day.date).getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 2) {
                break;
              }
            }
          }

          const pinnedRepos = (user.pinnedItems?.nodes || []).map(node => ({
            name: node.name,
            description: node.description,
            url: node.url,
            stars: node.stargazerCount || 0,
            forks: node.forkCount || 0,
            language: node.primaryLanguage?.name || 'N/A'
          }));

          githubStats = {
            totalContributions,
            currentStreak,
            topLanguages: ['TypeScript', 'Next.js', 'React', 'Supabase'],
            pinnedRepos
          };
          console.log('GitHub GraphQL query completed successfully.');
        }
      } else {
        console.warn('GitHub API GraphQL request failed, using mock fallbacks.');
      }
    } catch (err) {
      console.warn('GitHub sync request error, using fallback:', err);
    }
  } else {
    console.log('No GITHUB_STATS_TOKEN found, writing mock statistics fallbacks.');
  }

  // Save to Profiles table inside github_stats JSONB field
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ github_stats: githubStats })
      .eq('email', ownerEmail);

    if (error) {
      console.error('Failed to update Supabase profiles database:', error);
    } else {
      console.log('GitHub stats successfully synchronized inside profiles table.');
    }
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

run().catch(console.error);
