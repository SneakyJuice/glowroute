import { flClinics } from '../data/fl-clinics';

console.log('Number of FL clinics:', flClinics.length);
if (flClinics.length > 0) {
  console.log('First clinic:', JSON.stringify(flClinics[0], null, 2));
  console.log('Treatments:', flClinics[0].treatments);
}