import { prisma } from '../config/database.js';

export class FeatureFlagService {
  /**
   * Get all feature flags
   */
  async getAllFlags() {
    return await prisma.featureFlag.findMany({
      select: {
        key: true,
        name: true,
        description: true,
        isEnabled: true,
      },
      orderBy: {
        key: 'asc',
      },
    });
  }

  /**
   * Get enabled feature flags only (for frontend consumption)
   */
  async getEnabledFlags() {
    const flags = await prisma.featureFlag.findMany({
      where: {
        isEnabled: true,
      },
      select: {
        key: true,
      },
    });

    // Return as a simple object with keys as boolean flags
    return flags.reduce((acc, flag) => {
      acc[flag.key] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }

  /**
   * Update a feature flag's enabled status
   */
  async updateFlag(key: string, isEnabled: boolean) {
    return await prisma.featureFlag.update({
      where: { key },
      data: { isEnabled },
      select: {
        key: true,
        name: true,
        description: true,
        isEnabled: true,
      },
    });
  }

  /**
   * Check if a specific feature flag is enabled
   */
  async isFlagEnabled(key: string): Promise<boolean> {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
      select: { isEnabled: true },
    });

    return flag?.isEnabled ?? false;
  }

  /**
   * Bulk update feature flags
   */
  async bulkUpdateFlags(updates: Array<{ key: string; isEnabled: boolean }>) {
    const results = await Promise.all(
      updates.map(update =>
        prisma.featureFlag.update({
          where: { key: update.key },
          data: { isEnabled: update.isEnabled },
          select: {
            key: true,
            name: true,
            isEnabled: true,
          },
        }).catch(error => {
          console.error(`Failed to update flag ${update.key}:`, error);
          return null;
        })
      )
    );

    return results.filter(Boolean);
  }
}