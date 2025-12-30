# Qwen Models Guide for GOB Dashboard

This document provides information about the Qwen models available in the GOB Dashboard and when to use each one.

## Available Qwen Models

### Qwen Turbo (`qwen-turbo`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 1,000,000
- **Temperature**: 0.7
- **Cost**: $0.05 per million tokens (input)
- **Best For**:
  - Simple tasks and quick responses
  - High-volume applications where cost efficiency is critical
  - Basic text generation and summarization
  - Applications requiring fast turnaround times

### Qwen Plus (`qwen-plus`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 131,000
- **Temperature**: 0.7
- **Cost**: $0.40 per million tokens (input)
- **Best For**:
  - Complex reasoning tasks
  - Balanced performance between cost and capability
  - Moderate complexity text generation
  - Applications requiring good reasoning but not the highest performance

### Qwen Max (`qwen-max`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 33,000
- **Temperature**: 0.7
- **Cost**: $1.60 per million tokens (input)
- **Best For**:
  - Complex, multi-step tasks
  - Tasks requiring high accuracy and reasoning
  - Critical business applications where performance is more important than cost
  - Complex problem solving and analysis

### Qwen3 Coder Flash (`qwen3-coder-flash`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 1,000,000
- **Temperature**: 0.7
- **Cost**: $0.30 per million tokens (input)
- **Best For**:
  - Code generation and programming tasks
  - Software development assistance
  - Technical documentation
  - Debugging and code optimization
  - Programming-related queries and tasks

### Qwen3 Max (`qwen3-max`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 262,000
- **Temperature**: 0.7
- **Cost**: $0.86 per million tokens (input)
- **Best For**:
  - Latest generation with advanced reasoning capabilities
  - Complex multi-step tasks requiring the most advanced model
  - Tasks where the latest model improvements are beneficial
  - Advanced analysis and reasoning tasks

## Cost Comparison

| Model | Cost per Million Tokens | Context Window | Best Use Case |
|-------|------------------------|----------------|---------------|
| Qwen Turbo | $0.05 | 1M tokens | Cost-effective simple tasks |
| Qwen3 Coder Flash | $0.30 | 1M tokens | Coding and programming tasks |
| Qwen Plus | $0.40 | 131K tokens | Balanced performance |
| Qwen3 Max | $0.86 | 262K tokens | Advanced reasoning (latest gen) |
| Qwen Max | $1.60 | 33K tokens | Highest accuracy for complex tasks |

## Configuration in GOB Dashboard

To use Qwen models in the GOB Dashboard:

1. Set up your Alibaba Cloud API key as `ALIBABA_API_KEY` or `QWEN_API_KEY` in your environment variables
2. The models will be automatically available in the model selection dropdown
3. The orchestrator will automatically select the most appropriate model based on the task type and requirements

## API Endpoint

Qwen models are accessed through the same unified API endpoint as other models:

```
POST /api/orchestrator
{
  "message": "Your prompt here",
  "persona": "coder"  // For coding tasks with Qwen3 Coder Flash
}
```

Or directly via the Qwen service:

```
POST /api/ai-services
{
  "service": "qwen",
  "prompt": "Your prompt here"
}
```

## Environment Variables

- `ALIBABA_API_KEY`: Your Alibaba Cloud API key for Qwen models
- `QWEN_API_KEY`: Alternative environment variable name for Qwen API key

## Integration Notes

- Qwen models are integrated into the model selector agent and will be considered when selecting the best model for a task
- The "coder" persona automatically selects `qwen3-coder-flash` for coding-related tasks
- The "costconscious" persona selects `qwen-turbo` for cost-effective processing
- The "balanced" persona selects `qwen-plus` for balanced performance
