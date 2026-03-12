import { getGeminiModel, isGeminiAvailable } from '../config/gemini';
import InfrastructureNode from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';
import { getCriticalNodes } from './graphService';

const SYSTEM_PROMPT = `You are NEXUS AI, a city infrastructure resilience analyst. You analyze urban infrastructure dependencies, cascading failure risks, and provide actionable recommendations.

Your expertise covers:
- Power grid infrastructure (plants, substations, distribution)
- Water supply and distribution systems
- Transportation networks (roads, bridges, transit hubs)
- Telecommunications infrastructure (data centers, cell towers, fiber)
- Emergency services (hospitals, fire stations, police stations)

When analyzing infrastructure:
1. Identify critical vulnerabilities and single points of failure
2. Explain how failures cascade across interconnected systems
3. Recommend mitigation strategies and redundancy improvements
4. Prioritize risks by severity and likelihood

Always respond in a structured JSON format with these fields:
{
  "summary": "Brief overview of findings",
  "risks": ["risk1", "risk2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "criticalFindings": ["finding1", "finding2", ...]
}`;

async function getInfrastructureContext(): Promise<string> {
  const nodes = await InfrastructureNode.find().lean();
  const deps = await Dependency.find()
    .populate('sourceNodeId', 'name type')
    .populate('targetNodeId', 'name type')
    .lean();

  const sectorCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  for (const node of nodes) {
    sectorCounts[node.type] = (sectorCounts[node.type] || 0) + 1;
    statusCounts[node.status] = (statusCounts[node.status] || 0) + 1;
  }

  let criticalNodes: Awaited<ReturnType<typeof getCriticalNodes>> = [];
  try {
    criticalNodes = await getCriticalNodes(5);
  } catch {
    // Graph might be empty
  }

  return `
INFRASTRUCTURE OVERVIEW:
- Total nodes: ${nodes.length}
- Sectors: ${JSON.stringify(sectorCounts)}
- Status: ${JSON.stringify(statusCounts)}
- Total dependencies: ${deps.length}
- Top critical nodes: ${criticalNodes.map((n) => `${n.name} (${n.type}, score: ${n.compositeScore})`).join(', ')}

DEPENDENCY DETAILS:
${deps
  .slice(0, 50)
  .map((d: any) => `${d.sourceNodeId?.name || 'Unknown'} (${d.sourceNodeId?.type}) → ${d.targetNodeId?.name || 'Unknown'} (${d.targetNodeId?.type}) [${d.dependencyType}, strength: ${d.strength}]`)
  .join('\n')}
`;
}

export async function getAIInsights(
  context?: string,
  specificQuery?: string
): Promise<{
  summary: string;
  risks: string[];
  recommendations: string[];
  criticalFindings: string[];
}> {
  if (!isGeminiAvailable()) {
    return {
      summary: 'AI analysis unavailable — Gemini API key not configured.',
      risks: ['Cannot perform AI analysis without API key'],
      recommendations: ['Configure GEMINI_API_KEY in .env file'],
      criticalFindings: [],
    };
  }

  const model = getGeminiModel();
  const infraContext = await getInfrastructureContext();

  const prompt = `${SYSTEM_PROMPT}

CURRENT INFRASTRUCTURE DATA:
${infraContext}

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ''}
${specificQuery ? `USER QUERY: ${specificQuery}` : 'Provide a comprehensive infrastructure resilience analysis.'}

Respond ONLY with valid JSON in the format specified above.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Failed to parse JSON
  }

  return {
    summary: text,
    risks: [],
    recommendations: [],
    criticalFindings: [],
  };
}

export async function chatWithAI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  if (!isGeminiAvailable()) {
    return 'AI chat unavailable — please configure GEMINI_API_KEY in .env file.';
  }

  const model = getGeminiModel();
  const infraContext = await getInfrastructureContext();

  const historyText = conversationHistory
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `You are NEXUS AI, a city infrastructure resilience analyst. Be conversational but insightful.

INFRASTRUCTURE DATA:
${infraContext}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}
USER: ${message}

Provide a helpful, detailed response about the city's infrastructure. Use specific data from the infrastructure overview when possible.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
