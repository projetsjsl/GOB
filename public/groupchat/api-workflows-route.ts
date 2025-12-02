import { NextRequest, NextResponse } from 'next/server';

const WORKFLOWS = {
  'hotel-booking': { id: 'hotel-booking', name: 'Hotel Search', description: 'Search hotels on Booking.com', icon: '🏨', category: 'travel',
    variables: [{ name: 'location', label: 'City/Location', type: 'text', required: true, placeholder: 'Paris' }],
    taskTemplate: 'Search hotels in {location} on Booking.com' },
  'github-search': { id: 'github-search', name: 'GitHub Search', description: 'Find repositories', icon: '💻', category: 'development',
    variables: [{ name: 'query', label: 'Search Query', type: 'text', required: true, placeholder: 'react typescript' }],
    taskTemplate: 'Find {query} repositories on GitHub' },
  'amazon-product': { id: 'amazon-product', name: 'Amazon Search', description: 'Search products', icon: '🛒', category: 'shopping',
    variables: [{ name: 'product', label: 'Product Name', type: 'text', required: true, placeholder: 'wireless headphones' }],
    taskTemplate: 'Search for {product} on Amazon' },
  'linkedin-jobs': { id: 'linkedin-jobs', name: 'LinkedIn Jobs', description: 'Find jobs', icon: '💼', category: 'career',
    variables: [{ name: 'title', label: 'Job Title', type: 'text', required: true, placeholder: 'Software Engineer' }],
    taskTemplate: 'Find {title} jobs on LinkedIn' },
  'youtube-videos': { id: 'youtube-videos', name: 'YouTube Search', description: 'Search videos', icon: '📺', category: 'media',
    variables: [{ name: 'query', label: 'Search Query', type: 'text', required: true, placeholder: 'javascript tutorial' }],
    taskTemplate: 'Search for {query} videos on YouTube' },
  'web-research': { id: 'web-research', name: 'Web Research', description: 'Research a topic', icon: '🔬', category: 'research',
    variables: [{ name: 'topic', label: 'Research Topic', type: 'text', required: true, placeholder: 'AI trends 2024' }],
    taskTemplate: 'Research {topic} on Google' },
  'social-monitor': { id: 'social-monitor', name: 'Social Monitor', description: 'Monitor social media', icon: '📱', category: 'social',
    variables: [{ name: 'keyword', label: 'Keyword', type: 'text', required: true, placeholder: '@company or #hashtag' }],
    taskTemplate: 'Search for {keyword} on Twitter' },
  'price-tracker': { id: 'price-tracker', name: 'Price Tracker', description: 'Track prices', icon: '💰', category: 'shopping',
    variables: [{ name: 'product', label: 'Product', type: 'text', required: true }],
    taskTemplate: 'Check price for {product}' }
};

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📋' }, { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' }, { id: 'development', name: 'Development', icon: '💻' },
  { id: 'career', name: 'Career', icon: '💼' }, { id: 'research', name: 'Research', icon: '🔬' },
  { id: 'social', name: 'Social', icon: '📱' }, { id: 'media', name: 'Media', icon: '🎬' }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const id = searchParams.get('id');
  if (id) { const wf = WORKFLOWS[id as keyof typeof WORKFLOWS]; if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 }); return NextResponse.json(wf); }
  let workflows = Object.values(WORKFLOWS);
  if (category && category !== 'all') workflows = workflows.filter(w => w.category === category);
  return NextResponse.json({ workflows, categories: CATEGORIES, total: workflows.length });
}

export async function POST(req: NextRequest) {
  try {
    const { workflowId, variables } = await req.json();
    const workflow = WORKFLOWS[workflowId as keyof typeof WORKFLOWS];
    if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    for (const v of workflow.variables) { if (v.required && !variables[v.name]) return NextResponse.json({ error: `${v.label} is required` }, { status: 400 }); }
    let task = workflow.taskTemplate;
    for (const [key, value] of Object.entries(variables)) task = task.replace(`{${key}}`, String(value));
    return NextResponse.json({ success: true, task, workflow: { id: workflow.id, name: workflow.name, icon: workflow.icon } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
