/**
 * API Route: /api/groupchat/workflows
 * Workflows endpoint for JSLAI RobotWeb Ultimate v5.0
 */

const WORKFLOWS = {
  'hotel-booking': { 
    id: 'hotel-booking', 
    name: 'Hotel Search', 
    description: 'Search hotels on Booking.com', 
    icon: '🏨', 
    category: 'travel',
    variables: [{ name: 'location', label: 'City/Location', type: 'text', required: true, placeholder: 'Paris' }],
    taskTemplate: 'Search hotels in {location} on Booking.com' 
  },
  'github-search': { 
    id: 'github-search', 
    name: 'GitHub Search', 
    description: 'Find repositories', 
    icon: '💻', 
    category: 'development',
    variables: [{ name: 'query', label: 'Search Query', type: 'text', required: true, placeholder: 'react typescript' }],
    taskTemplate: 'Find {query} repositories on GitHub' 
  },
  'amazon-product': { 
    id: 'amazon-product', 
    name: 'Amazon Search', 
    description: 'Search products', 
    icon: '🛒', 
    category: 'shopping',
    variables: [{ name: 'product', label: 'Product Name', type: 'text', required: true, placeholder: 'wireless headphones' }],
    taskTemplate: 'Search for {product} on Amazon' 
  },
  'linkedin-jobs': { 
    id: 'linkedin-jobs', 
    name: 'LinkedIn Jobs', 
    description: 'Find jobs', 
    icon: '💼', 
    category: 'career',
    variables: [{ name: 'title', label: 'Job Title', type: 'text', required: true, placeholder: 'Software Engineer' }],
    taskTemplate: 'Find {title} jobs on LinkedIn' 
  },
  'youtube-videos': { 
    id: 'youtube-videos', 
    name: 'YouTube Search', 
    description: 'Search videos', 
    icon: '📺', 
    category: 'media',
    variables: [{ name: 'query', label: 'Search Query', type: 'text', required: true, placeholder: 'javascript tutorial' }],
    taskTemplate: 'Search for {query} videos on YouTube' 
  },
  'web-research': { 
    id: 'web-research', 
    name: 'Web Research', 
    description: 'Research a topic', 
    icon: '🔬', 
    category: 'research',
    variables: [{ name: 'topic', label: 'Research Topic', type: 'text', required: true, placeholder: 'AI trends 2024' }],
    taskTemplate: 'Research {topic} on Google' 
  },
  'social-monitor': { 
    id: 'social-monitor', 
    name: 'Social Monitor', 
    description: 'Monitor social media', 
    icon: '📱', 
    category: 'social',
    variables: [{ name: 'keyword', label: 'Keyword', type: 'text', required: true, placeholder: '@company or #hashtag' }],
    taskTemplate: 'Search for {keyword} on Twitter' 
  },
  'price-tracker': { 
    id: 'price-tracker', 
    name: 'Price Tracker', 
    description: 'Track prices', 
    icon: '💰', 
    category: 'shopping',
    variables: [{ name: 'product', label: 'Product', type: 'text', required: true }],
    taskTemplate: 'Check price for {product}' 
  }
};

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📋' }, 
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' }, 
  { id: 'development', name: 'Development', icon: '💻' },
  { id: 'career', name: 'Career', icon: '💼' }, 
  { id: 'research', name: 'Research', icon: '🔬' },
  { id: 'social', name: 'Social', icon: '📱' }, 
  { id: 'media', name: 'Media', icon: '🎬' }
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { category, id } = req.query;
    if (id) { 
      const wf = WORKFLOWS[id]; 
      if (!wf) return res.status(404).json({ error: 'Not found' }); 
      return res.json(wf); 
    }
    let workflows = Object.values(WORKFLOWS);
    if (category && category !== 'all') workflows = workflows.filter(w => w.category === category);
    return res.json({ workflows, categories: CATEGORIES, total: workflows.length });
  }

  if (req.method === 'POST') {
    try {
      const { workflowId, variables } = req.body;
      const workflow = WORKFLOWS[workflowId];
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
      for (const v of workflow.variables) { 
        if (v.required && !variables[v.name]) return res.status(400).json({ error: `${v.label} is required` }); 
      }
      let task = workflow.taskTemplate;
      for (const [key, value] of Object.entries(variables)) task = task.replace(`{${key}}`, String(value));
      return res.json({ success: true, task, workflow: { id: workflow.id, name: workflow.name, icon: workflow.icon } });
    } catch (e) { 
      return res.status(500).json({ error: e.message }); 
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

