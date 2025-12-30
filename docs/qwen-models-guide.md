# Qwen Models Guide for GOB Dashboard

This document provides information about the Qwen models available in the GOB Dashboard and when to use each one.

## Available Qwen Models

### Qwen Turbo (`qwen-turbo`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 1,000,000
- **Temperature**: 0.7
- **Cost**: $0.05 per million tokens (input)
- **Best For**:
  - Simple tasks requiring fast responses
  - High-volume applications where cost efficiency is important
  - Basic text generation and summarization
  - Applications requiring quick turnaround times

### Qwen Plus (`qwen-plus`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 131,000
- **Temperature**: 0.7
- **Cost**: $0.40 per million tokens (input)
- **Best For**:
  - Complex reasoning tasks
  - Balanced performance between cost and capability
  - Moderate complexity applications
  - Tasks requiring good reasoning but not the highest level of intelligence

### Qwen Max (`qwen-max`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 33,000
- **Temperature**: 0.7
- **Cost**: $1.60 per million tokens (input)
- **Best For**:
  - Complex, multi-step tasks
  - Highly complex reasoning and analysis
  - Tasks requiring the highest level of intelligence
  - Critical applications where accuracy is paramount

### Qwen3 Coder Flash (`qwen3-coder-flash`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 1,000,000
- **Temperature**: 0.7
- **Cost**: $0.30 per million tokens (input)
- **Best For**:
  - Code generation and programming tasks
  - Software development assistance
  - Technical documentation generation
  - Programming problem solving

### Qwen3 Max (`qwen3-max`)
- **Provider**: Alibaba Cloud
- **Max Tokens**: 262,000
- **Temperature**: 0.7
- **Cost**: $0.86 per million tokens (input)
- **Best For**:
  - Latest generation model with advanced reasoning
  - Complex tasks requiring state-of-the-art capabilities
  - Applications needing the most recent model improvements
  - Advanced analysis and reasoning tasks

## API Configuration

To use Qwen models, you need to configure your Alibaba Cloud API key:

1. Set the `ALIBABA_API_KEY` or `QWEN_API_KEY` environment variable
2. The API endpoint used is: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
3. The models are accessed via the `qwen` service in the AI services API

## Cost Comparison

| Model | Cost per Million Tokens | Context Window | Best Use Case |
|-------|------------------------|----------------|---------------|
| Qwen Turbo | $0.05 | 1,000,000 | Fast, economical tasks |
| Qwen Plus | $0.40 | 131,000 | Balanced performance |
| Qwen Max | $1.60 | 33,000 | Complex, high-intelligence tasks |
| Qwen3 Coder Flash | $0.30 | 1,000,000 | Code generation |
| Qwen3 Max | $0.86 | 262,000 | Advanced reasoning |

## Integration Notes

- The Qwen models are integrated into the existing LLM registry system
- They can be selected dynamically based on task requirements
- The system will automatically use the configured model based on the selected provider
- All standard parameters (temperature, max_tokens) are supported

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
