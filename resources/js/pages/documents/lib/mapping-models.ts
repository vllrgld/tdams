export function mappingModelLabel(model: string): string {
    switch (model) {
        case 'openai/gpt-oss-120b':
            return 'GPT-OSS 120B (Groq)';
        case 'openai/gpt-oss-20b':
            return 'GPT-OSS 20B (Groq)';
        default:
            return model;
    }
}

export function resolveMappingModel(
    models: string[],
    selected: string,
): string {
    return models.includes(selected) ? selected : (models[0] ?? '');
}
