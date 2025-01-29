import { Request, Response } from 'express';

async function getPlans(req: Request, res: Response) {
  try {
    // use the models to interact with database
    // process the data
    // send the data back

    res.status(200).json({ plans: 'My Plans' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

export { getPlans };
