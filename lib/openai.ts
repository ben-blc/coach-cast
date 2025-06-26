// OpenAI API integration - Client-side wrapper for server actions

import { 
  extractGoalsFromTranscriptAction,
  isOpenAIConfiguredAction,
  type GoalExtractionResponse
} from './actions/openai-actions';

export type { GoalExtractionResponse };

// Client-side wrapper for extracting goals from transcript
export async function extractGoalsFromTranscript(transcript: string): Promise<GoalExtractionResponse> {
  try {
    return await extractGoalsFromTranscriptAction(transcript);
  } catch (error) {
    console.error('❌ Error calling extractGoalsFromTranscriptAction:', error);
    return {
      goals: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Client-side wrapper for checking if OpenAI API key is configured
export async function isOpenAIConfigured(): Promise<boolean> {
  try {
    return await isOpenAIConfiguredAction();
  } catch (error) {
    console.error('❌ Error checking OpenAI configuration:', error);
    return false;
  }
}