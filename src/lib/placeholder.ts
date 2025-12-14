export function replacePlaceholders(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `\${${key}}`;
    // Replace all occurrences
    result = result.split(placeholder).join(value);
  }
  return result;
}
