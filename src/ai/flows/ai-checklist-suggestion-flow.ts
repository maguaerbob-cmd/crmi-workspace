'use server';
/**
 * @fileOverview Provides an AI-powered flow to suggest checklist items for a given task title and description.
 *
 * - suggestChecklist - A function that generates a suggested checklist.
 * - AIChecklistSuggestionInput - The input type for the suggestChecklist function.
 * - AIChecklistSuggestionOutput - The return type for the suggestChecklist function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIChecklistSuggestionInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('The description of the task.'),
});
export type AIChecklistSuggestionInput = z.infer<typeof AIChecklistSuggestionInputSchema>;

const AIChecklistSuggestionOutputSchema = z.object({
  checklist: z.array(z.object({
    text: z.string().describe('The text of the checklist item.'),
    done: z.boolean().default(false).describe('Whether the checklist item is completed. Defaults to false.'),
  })).describe('An array of suggested checklist items for the task.'),
});
export type AIChecklistSuggestionOutput = z.infer<typeof AIChecklistSuggestionOutputSchema>;

export async function suggestChecklist(input: AIChecklistSuggestionInput): Promise<AIChecklistSuggestionOutput> {
  return aiChecklistSuggestionFlow(input);
}

const suggestChecklistPrompt = ai.definePrompt({
  name: 'suggestChecklistPrompt',
  input: { schema: AIChecklistSuggestionInputSchema },
  output: { schema: AIChecklistSuggestionOutputSchema },
  prompt: `You are an expert task planner. Your goal is to generate a comprehensive checklist for a task based on its title and description.
Each checklist item should be a distinct step required to complete the task.
Return the checklist as a JSON array of objects, where each object has a 'text' property for the item description and a 'done' property set to 'false'.

Task Title: {{{title}}}
Task Description: {{{description}}}

Please provide the checklist in the following JSON format:
{{jsonSchema output.schema}}`,
});

const aiChecklistSuggestionFlow = ai.defineFlow(
  {
    name: 'aiChecklistSuggestionFlow',
    inputSchema: AIChecklistSuggestionInputSchema,
    outputSchema: AIChecklistSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await suggestChecklistPrompt(input);
    return output!;
  }
);
