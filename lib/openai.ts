// OpenAI API integration for goal extraction from coaching session transcripts

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_BASE = 'https://api.openai.com/v1';

export interface GoalExtractionResponse {
  goals: string[];
  success: boolean;
  error?: string;
}

export async function extractGoalsFromTranscript(transcript: string): Promise<GoalExtractionResponse> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.warn('⚠️ OpenAI API key not configured');
    return {
      goals: [],
      success: false,
      error: 'OpenAI API key not configured'
    };
  }

  if (!transcript || transcript.trim().length === 0) {
    return {
      goals: [],
      success: false,
      error: 'No transcript provided'
    };
  }

  try {
    console.log('🎯 Extracting goals from transcript using OpenAI...');
    
    const prompt = `You are a helpful assistant which helps fetch the goals agreed by the coach and coachee during the coaching session, the conversation is as follows. your output must be a javascript array of strings with the goals listed there.

${transcript}`;

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    console.log(`📡 OpenAI API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API Error: ${response.status} - ${errorText}`);
      return {
        goals: [],
        success: false,
        error: `OpenAI API error: ${response.status}`
      };
    }

    const data = await response.json();
    console.log('✅ OpenAI response received:', data);

    if (!data.choices || data.choices.length === 0) {
      return {
        goals: [],
        success: false,
        error: 'No response from OpenAI'
      };
    }

    const content = data.choices[0].message?.content;
    if (!content) {
      return {
        goals: [],
        success: false,
        error: 'Empty response from OpenAI'
      };
    }

    // Try to parse the response as JSON array
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```javascript\n?/g, '')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const goals = JSON.parse(cleanedContent);
      
      if (Array.isArray(goals)) {
        console.log('✅ Successfully extracted goals:', goals);
        return {
          goals: goals.filter(goal => typeof goal === 'string' && goal.trim().length > 0),
          success: true
        };
      } else {
        console.error('❌ Response is not an array:', goals);
        return {
          goals: [],
          success: false,
          error: 'Response is not a valid array'
        };
      }
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI response as JSON:', parseError);
      
      // Fallback: try to extract goals from text manually
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const extractedGoals = lines
        .map(line => line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 200); // Reasonable goal length
      
      if (extractedGoals.length > 0) {
        console.log('✅ Extracted goals from text fallback:', extractedGoals);
        return {
          goals: extractedGoals,
          success: true
        };
      }
      
      return {
        goals: [],
        success: false,
        error: 'Could not parse goals from response'
      };
    }
    
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    return {
      goals: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Utility function to check if OpenAI API key is configured
export function isOpenAIConfigured(): boolean {
  return !!(OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here');
}