import { Router, Request, Response } from 'express';
import Scenario from '../models/Scenario';
import SimulationResult from '../models/SimulationResult';
import { runSimulation } from '../services/simulationService';

const router = Router();

// GET /api/scenarios — list all scenarios
router.get('/', async (_req: Request, res: Response) => {
  try {
    const scenarios = await Scenario.find().sort({ createdAt: -1 });
    res.json(scenarios);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scenarios/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    res.json(scenario);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scenarios — create scenario
router.post('/', async (req: Request, res: Response) => {
  try {
    const scenario = await Scenario.create(req.body);
    res.status(201).json(scenario);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/scenarios/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    await SimulationResult.deleteMany({ scenarioId: scenario._id });
    res.json({ message: 'Scenario and results deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scenarios/:id/run — execute simulation
router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const result = await runSimulation(req.params.id as string, req.body.options);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scenarios/:id/results — get simulation results for scenario
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const results = await SimulationResult.find({ scenarioId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
