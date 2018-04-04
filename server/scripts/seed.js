'use strict';

const app = require('../server');
const Specialization = app.models.Specialization;
const TrainingLevel = app.models.TrainingLevel;

Specialization.create([
  {name: 'Cardiology'},
  {name: 'Internal Medicine'},
  {name: 'Anesthesiology'},
]);

TrainingLevel.create([
  {description: 'Attending Physician'},
  {description: 'Fellow Physician'},
  {description: 'Resident Physician'},
  {description: 'Medical Student'},
  {description: 'Other'},
]);
