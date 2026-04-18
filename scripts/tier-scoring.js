const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const supabaseUrl = 'https://psiuknphchmhsthvhkpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaXVrbnBoY2htaHN0aHZoa3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTE4NjgsImV4cCI6MjA5MDM4Nzg2OH0.TBvE2W-156B_knhKYRSTK0koNfB3zIkZyykSpAPrMZY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Output directories
const outputDir = path.join(__dirname, '../../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Tier definitions
const TIER_DEFINITIONS = {
  TIER_1: { glow_score: 5.0, review_count: 100 },
  TIER_2: { glow_score: 4.0, review_count: 50 },
  TIER_3: { glow_score: 4.0, review_count: 20 },
};

// Function to assign tier based on glow_score and review_count
function assignTier(clinic) {
  if (clinic.glow_score === TIER_DEFINITIONS.TIER_1.glow_score && clinic.review_count >= TIER_DEFINITIONS.TIER_1.review_count) {
    return 1;
  } else if (clinic.glow_score >= TIER_DEFINITIONS.TIER_2.glow_score && clinic.review_count >= TIER_DEFINITIONS.TIER_2.review_count) {
    return 2;
  } else if (clinic.glow_score >= TIER_DEFINITIONS.TIER_3.glow_score && clinic.review_count >= TIER_DEFINITIONS.TIER_3.review_count) {
    return 3;
  } else {
    return 4;
  }
}

// Main function
async function tierScoring() {
  try {
    // Query all clinics
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('*');

    if (error) throw error;

    // Assign tiers and update clinics
    const updatedClinics = clinics.map(clinic => {
      const tier = assignTier(clinic);
      return { ...clinic, tier };
    });

    // Attempt to update the `tier` column in Supabase
    try {
      const { data: updateResult, error: updateError } = await supabase
        .from('clinics')
        .upsert(updatedClinics);

      if (updateError) throw updateError;
      console.log('Successfully updated tiers in Supabase.');
    } catch (updateError) {
      console.warn('Failed to update tiers in Supabase. Saving to JSON/CSV instead.');
    }

    // Group clinics by tier
    const tierGroups = updatedClinics.reduce((acc, clinic) => {
      if (!acc[clinic.tier]) acc[clinic.tier] = [];
      acc[clinic.tier].push(clinic);
      return acc;
    }, {});

    // Count clinics per tier
    const tierCounts = Object.keys(tierGroups).reduce((acc, tier) => {
      acc[`Tier ${tier}`] = tierGroups[tier].length;
      return acc;
    }, {});

    // Calculate percentages
    const totalClinics = updatedClinics.length;
    const tierPercentages = Object.keys(tierCounts).reduce((acc, tier) => {
      acc[tier] = ((tierCounts[tier] / totalClinics) * 100).toFixed(2) + '%';
      return acc;
    }, {});

    // Get top 5 cities per tier
    const topCitiesByTier = Object.keys(tierGroups).reduce((acc, tier) => {
      const cities = tierGroups[tier].reduce((cityAcc, clinic) => {
        if (!cityAcc[clinic.city]) cityAcc[clinic.city] = 0;
        cityAcc[clinic.city]++;
        return cityAcc;
      }, {});

      const sortedCities = Object.entries(cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      acc[`Tier ${tier}`] = sortedCities;
      return acc;
    }, {});

    // Prepare results
    const results = {
      totalClinics,
      tierCounts,
      tierPercentages,
      topCitiesByTier,
      hitRate: ((tierCounts['Tier 1'] + tierCounts['Tier 2']) / totalClinics * 100).toFixed(2) + '%',
    };

    // Save results to JSON
    const jsonPath = path.join(outputDir, 'tier-scoring-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${jsonPath}`);

    // Save tier breakdown to CSV
    const csvPath = path.join(outputDir, 'tier-breakdown.csv');
    const csvHeader = 'id,name,city,glow_score,review_count,tier\n';
    const csvRows = updatedClinics.map(clinic => 
      `${clinic.id},"${clinic.name}","${clinic.city}",${clinic.glow_score},${clinic.review_count},${clinic.tier}`
    ).join('\n');
    fs.writeFileSync(csvPath, csvHeader + csvRows);
    console.log(`Tier breakdown saved to ${csvPath}`);

    // Print summary report
    console.log('\n--- Summary Report ---');
    console.log(`Total Clinics Processed: ${totalClinics}`);
    console.log('\nTier Counts:');
    console.log(JSON.stringify(tierCounts, null, 2));
    console.log('\nTier Percentages:');
    console.log(JSON.stringify(tierPercentages, null, 2));
    console.log('\nTop 5 Cities by Tier:');
    console.log(JSON.stringify(topCitiesByTier, null, 2));
    console.log(`\nHit Rate (Tiers 1+2): ${results.hitRate}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

// Run the script
tierScoring();