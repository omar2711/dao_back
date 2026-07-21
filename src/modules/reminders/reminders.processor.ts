import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_SEND, JOB_SWEEP, REMINDERS_QUEUE } from './reminders.constants';
import { RemindersService } from './services/reminders.service';

// Worker que consume la cola `reminders`: envía recordatorios cuando dispara el
// job delayed, y ejecuta el sweep repetible cada 25 min.
@Processor(REMINDERS_QUEUE)
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(private readonly reminders: RemindersService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === JOB_SWEEP) {
      await this.reminders.runSweep();
      return;
    }
    if (job.name === JOB_SEND) {
      const { appointmentId } = job.data as { appointmentId: string };
      await this.reminders.sendReminder(appointmentId);
    }
  }
}
