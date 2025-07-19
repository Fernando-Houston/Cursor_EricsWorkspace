import { Pool } from 'pg';
import { HCADImportPipeline, ValuePredictionPipeline } from './import-pipeline';
import * as cron from 'node-cron';

// Automated Monthly HCAD Update Process

export class MonthlyHCADUpdater {
  private pool: Pool;
  
  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  // Run this on the 5th of each month
  scheduleMonthlyUpdates() {
    cron.schedule('0 2 5 * *', async () => {
      console.log('🗓️ Starting scheduled monthly HCAD update...');
      await this.runMonthlyUpdate();
    });
  }

  async runMonthlyUpdate(csvPath?: string) {
    try {
      // 1. Download latest HCAD data (or use provided path)
      const dataPath = csvPath || await this.downloadLatestData();
      
      // 2. Run import pipeline
      const importer = new HCADImportPipeline(this.pool);
      const stats = await importer.importMonthlyData(dataPath);
      
      // 3. Run ML predictions
      const predictor = new ValuePredictionPipeline(this.pool);
      await predictor.predictMissingValues();
      
      // 4. Generate reports
      await this.generateMonthlyReport(stats);
      
      // 5. Send notifications
      await this.sendUpdateNotification(stats);
      
    } catch (error) {
      console.error('Monthly update failed:', error);
      await this.sendErrorNotification(error as Error);
    }
  }

  private async downloadLatestData(): Promise<string> {
    // Implement HCAD download logic
    // Could use puppeteer to automate download from HCAD website
    // Or use their API if available
    return '/tmp/hcad_latest.csv';
  }

  private async generateMonthlyReport(stats: any) {
    const report = await this.pool.query(`
      -- Monthly Change Summary
      WITH monthly_summary AS (
        SELECT 
          COUNT(DISTINCT account_number) as properties_changed,
          COUNT(DISTINCT CASE WHEN change_type = 'owner_change' THEN account_number END) as owner_changes,
          COUNT(DISTINCT CASE WHEN change_type = 'value_change' THEN account_number END) as value_changes
        FROM property_history
        WHERE change_date >= CURRENT_DATE - INTERVAL '30 days'
      ),
      -- Top Movers
      top_gainers AS (
        SELECT 
          account_number,
          property_address,
          old_value::numeric as old_val,
          new_value::numeric as new_val,
          (new_value::numeric - old_value::numeric) as gain
        FROM property_history
        WHERE field_name = 'total_value' 
          AND change_date >= CURRENT_DATE - INTERVAL '30 days'
          AND old_value::numeric > 0
        ORDER BY (new_value::numeric - old_value::numeric) DESC
        LIMIT 10
      ),
      -- Market Trends
      market_trends AS (
        SELECT 
          zip,
          AVG(total_value) as current_avg,
          LAG(AVG(total_value)) OVER (PARTITION BY zip ORDER BY month) as prev_avg
        FROM market_analytics
        GROUP BY zip, month
      )
      SELECT 
        ms.*,
        json_agg(DISTINCT tg.*) as top_gainers,
        json_agg(DISTINCT mt.*) as market_trends
      FROM monthly_summary ms
      CROSS JOIN top_gainers tg
      CROSS JOIN market_trends mt
      GROUP BY ms.properties_changed, ms.owner_changes, ms.value_changes
    `);

    console.log('📊 Monthly Report:', report.rows[0]);
    // Save to file or database
  }

  private async sendUpdateNotification(stats: any) {
    // Send email/webhook with update summary
    console.log('📧 Sending update notification...', {
      subject: `HCAD Monthly Update - ${new Date().toLocaleDateString()}`,
      summary: stats
    });
  }

  private async sendErrorNotification(error: Error) {
    // Alert on failures
    console.error('🚨 Update failed, sending alert...', error.message);
  }
}

// Usage example
async function setupMonthlyUpdates() {
  const updater = new MonthlyHCADUpdater(
    process.env.RAILWAY_HCAD_DATABASE_URL!
  );
  
  // Schedule automatic updates
  updater.scheduleMonthlyUpdates();
  
  // Or run manually
  // await updater.runMonthlyUpdate('/path/to/new/hcad_data.csv');
}

// API endpoint for manual triggers
export async function handleManualUpdate(csvPath: string) {
  const updater = new MonthlyHCADUpdater(
    process.env.RAILWAY_HCAD_DATABASE_URL!
  );
  
  return await updater.runMonthlyUpdate(csvPath);
}