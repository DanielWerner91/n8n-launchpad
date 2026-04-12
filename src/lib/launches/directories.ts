import type { DirectoryInfo } from "./types";

export const LAUNCH_DIRECTORIES: DirectoryInfo[] = [
  { name: "Product Hunt", url: "https://www.producthunt.com", submission_url: "https://www.producthunt.com/posts/new", submission_type: "free", cost: "$0", category: "general", description_format: "Tagline (60 chars) + Description (260 chars)", max_description_length: 260, best_for: "All products", review_time: "1-3 days" },
  { name: "BetaList", url: "https://betalist.com", submission_url: "https://betalist.com/submit", submission_type: "expedited", cost: "$0 free / $129 expedited", category: "beta", description_format: "Short pitch (160 chars) + Full description (500 chars)", max_description_length: 500, best_for: "Pre-launch products", review_time: "2-4 weeks free / 48h expedited" },
  { name: "DevHunt", url: "https://devhunt.org", submission_url: "https://devhunt.org/submit", submission_type: "free", cost: "$0", category: "developer", description_format: "Title + Description (300 chars)", max_description_length: 300, best_for: "Developer tools", review_time: "1-2 days" },
  { name: "Hacker News", url: "https://news.ycombinator.com", submission_url: "https://news.ycombinator.com/submit", submission_type: "free", cost: "$0", category: "technical", description_format: "Show HN: Title + Text", max_description_length: 2000, best_for: "Technical products", review_time: "Instant" },
  { name: "SaaSHub", url: "https://www.saashub.com", submission_url: "https://www.saashub.com/submit", submission_type: "free", cost: "$0", category: "saas", description_format: "Name + Description + Category", max_description_length: 500, best_for: "SaaS products", review_time: "3-7 days" },
  { name: "AlternativeTo", url: "https://alternativeto.net", submission_url: "https://alternativeto.net/contribute/new-app/", submission_type: "free", cost: "$0", category: "general", description_format: "Description + Screenshots", max_description_length: 1000, best_for: "Products with clear alternatives", review_time: "1-5 days" },
  { name: "Indie Hackers", url: "https://www.indiehackers.com", submission_url: "https://www.indiehackers.com/products/new", submission_type: "free", cost: "$0", category: "indie", description_format: "Product profile + Build story", max_description_length: 2000, best_for: "Bootstrapped products", review_time: "Instant" },
  { name: "Launching Next", url: "https://www.launchingnext.com", submission_url: "https://www.launchingnext.com/submit/", submission_type: "free", cost: "$0", category: "startup", description_format: "Description (300 chars)", max_description_length: 300, best_for: "New startups", review_time: "3-7 days" },
  { name: "Startup Stash", url: "https://startupstash.com", submission_url: "https://startupstash.com/add-listing/", submission_type: "free", cost: "$0", category: "startup", description_format: "Description + Category", max_description_length: 500, best_for: "Startup tools", review_time: "5-10 days" },
  { name: "GetApp", url: "https://www.getapp.com", submission_url: "https://www.getapp.com/vendor-signup/", submission_type: "free", cost: "$0", category: "saas", description_format: "Full product profile", max_description_length: 2000, best_for: "B2B SaaS", review_time: "7-14 days" },
];

export const AI_DIRECTORIES: DirectoryInfo[] = [
  { name: "There's An AI For That", url: "https://theresanaiforthat.com", submission_url: "https://theresanaiforthat.com/submit/", submission_type: "free", cost: "$0", category: "ai", description_format: "Name + Description + Category", max_description_length: 500, best_for: "AI products", review_time: "1-3 days" },
  { name: "Futurepedia", url: "https://www.futurepedia.io", submission_url: "https://www.futurepedia.io/submit-tool", submission_type: "free", cost: "$0", category: "ai", description_format: "Tool description + Use cases", max_description_length: 500, best_for: "AI tools", review_time: "3-5 days" },
  { name: "Toolify", url: "https://www.toolify.ai", submission_url: "https://www.toolify.ai/submit", submission_type: "free", cost: "$0", category: "ai", description_format: "Description + Features", max_description_length: 500, best_for: "AI tools", review_time: "2-5 days" },
];

export function getRelevantDirectories(niche: string, isAI: boolean): DirectoryInfo[] {
  const dirs = [...LAUNCH_DIRECTORIES];
  if (isAI) dirs.push(...AI_DIRECTORIES);
  return dirs;
}
