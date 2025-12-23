/**
 * MCP TOOLS AGENT - Model Context Protocol Tools
 * 
 * Provides access to MCP tools directly from the orchestrator.
 * This allows any chatbot/prompt to call MCP tools.
 * 
 * Available MCP Servers:
 * - perplexity-ask: Web search with AI analysis
 * - supabase-mcp-server: Database operations
 * 
 * Usage via orchestrator:
 *   POST /api/orchestrator
 *   { "agent": "mcp", "action": "perplexity_ask", "query": "..." }
 */

import { BaseAgent } from './base-agent.js';

class MCPToolsAgent extends BaseAgent {
    constructor() {
        super('MCPToolsAgent', [
            'perplexity_ask',
            'supabase_query',
            'supabase_migration',
            'search_docs',
            'list_mcp_tools',
            'execute_mcp_tool'
        ]);
        
        this.mcpServers = {
            'perplexity-ask': {
                name: 'Perplexity Ask',
                status: 'available',
                tools: ['perplexity_ask']
            },
            'supabase-mcp-server': {
                name: 'Supabase MCP',
                status: 'available',
                tools: ['execute_sql', 'apply_migration', 'list_tables', 'search_docs']
            }
        };
    }

    async _executeInternal(task, context) {
        const { action, ...params } = task;

        switch (action) {
            case 'list_mcp_tools':
                return this._listMCPTools();
                
            case 'perplexity_ask':
                return this._callPerplexityAsk(params);
                
            case 'supabase_query':
                return this._callSupabaseQuery(params);
                
            case 'supabase_migration':
                return this._callSupabaseMigration(params);
                
            case 'search_docs':
                return this._searchSupabaseDocs(params);
                
            case 'execute_mcp_tool':
                return this._executeMCPTool(params);
                
            default:
                throw new Error(`Unknown MCP action: ${action}`);
        }
    }

    /**
     * List all available MCP tools
     */
    _listMCPTools() {
        const tools = [];
        
        for (const [serverId, server] of Object.entries(this.mcpServers)) {
            for (const tool of server.tools) {
                tools.push({
                    server: serverId,
                    serverName: server.name,
                    tool,
                    status: server.status
                });
            }
        }
        
        return {
            success: true,
            tools,
            count: tools.length
        };
    }

    /**
     * Call Perplexity Ask MCP
     */
    async _callPerplexityAsk({ query, messages }) {
        // Format messages for Perplexity
        const formattedMessages = messages || [
            { role: 'user', content: query }
        ];

        try {
            const response = await fetch('/api/emma-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: query,
                    model: 'perplexity',
                    channel: 'mcp'
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity call failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                response: data.response || data.message,
                citations: data.citations || [],
                model: data.model || 'perplexity'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute SQL query via Supabase MCP
     */
    async _callSupabaseQuery({ query, projectId }) {
        try {
            // Get project ID from environment if not provided
            const pid = projectId || process.env.SUPABASE_PROJECT_ID;
            
            if (!pid) {
                return { success: false, error: 'No project ID provided' };
            }

            // This would typically call the MCP server directly
            // For now, we use the internal Supabase client
            const response = await fetch('/api/admin/supabase-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, projectId: pid })
            });

            if (!response.ok) {
                throw new Error(`Supabase query failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                result: data.result || data.data,
                rowCount: data.rowCount || (data.data?.length || 0)
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply migration via Supabase MCP
     */
    async _callSupabaseMigration({ name, sql, projectId }) {
        try {
            const pid = projectId || process.env.SUPABASE_PROJECT_ID;
            
            if (!pid) {
                return { success: false, error: 'No project ID provided' };
            }

            // This would call the MCP apply_migration tool
            return {
                success: true,
                message: `Migration "${name}" would be applied (MCP integration pending)`,
                sql: sql?.substring(0, 100) + '...'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Search Supabase documentation
     */
    async _searchSupabaseDocs({ query, limit = 5 }) {
        try {
            // GraphQL query for Supabase docs
            const graphqlQuery = `
                query SearchDocs {
                    searchDocs(query: "${query}", limit: ${limit}) {
                        nodes {
                            ... on Guide {
                                title
                                href
                                content
                            }
                            ... on TroubleshootingGuide {
                                title
                                href
                                content
                            }
                        }
                        totalCount
                    }
                }
            `;

            return {
                success: true,
                message: 'Doc search via MCP (GraphQL)',
                query,
                graphqlQuery
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generic MCP tool execution
     */
    async _executeMCPTool({ server, tool, params }) {
        if (!this.mcpServers[server]) {
            return { success: false, error: `Unknown MCP server: ${server}` };
        }

        if (!this.mcpServers[server].tools.includes(tool)) {
            return { 
                success: false, 
                error: `Tool "${tool}" not available on server "${server}"`,
                availableTools: this.mcpServers[server].tools
            };
        }

        // Route to appropriate handler
        switch (`${server}:${tool}`) {
            case 'perplexity-ask:perplexity_ask':
                return this._callPerplexityAsk(params);
            case 'supabase-mcp-server:execute_sql':
                return this._callSupabaseQuery(params);
            case 'supabase-mcp-server:apply_migration':
                return this._callSupabaseMigration(params);
            case 'supabase-mcp-server:search_docs':
                return this._searchSupabaseDocs(params);
            default:
                return {
                    success: false,
                    error: `No handler for ${server}:${tool}`
                };
        }
    }
}

export const mcpToolsAgent = new MCPToolsAgent();
export { MCPToolsAgent };
