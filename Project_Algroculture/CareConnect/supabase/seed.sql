-- ============================================================
-- CareConnect Seed Data (Sarah Jenkins — demo patient)
-- Run AFTER schema.sql.
-- Replace 'REPLACE_WITH_YOUR_CLERK_USER_ID' with your actual
-- Clerk user ID from the Clerk dashboard after you sign up.
-- ============================================================

-- ── Doctor ───────────────────────────────────────────────────
insert into doctors (id, name, role, avatar_url, clinic) values
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Dr. Emily Chen',
  'Primary Physician',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuACHD56WKKWrA-3XAFPd1uAw-A_aQ8Zc0dq2GEtceVMRaak8tJZHpXaCH5DSvkw7xcZlsHYCufvXjth8ORUi9PX9qGVCrPLh6ubXMkDcxHG51TofhxflTZFLcFMtZ4gxFC5Sh2UNp-N7gxD-ZQwrhP9uGQnIPBqqbFFUkD2Jl8qd1ZF6UrDbt3MUxDMbnHQ9Ts-7KhFc12-mk3UcaOd1S_ilTgstXnlKNfmk5rzfDbrCbvytuMVWQ8w8w',
  'Central Health Medical Center'
),
(
  'a1b2c3d4-0000-0000-0000-000000000002',
  'Dr. Marcus Vance',
  'Cardiologist',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
  'Heart & Vascular Institute'
);

-- ── Patient ───────────────────────────────────────────────────
-- Replace the id value below with your Clerk user ID
insert into patients (id, name, dob, mrn, insurance, primary_doctor_id) values
(
  'REPLACE_WITH_YOUR_CLERK_USER_ID',
  'Sarah Jenkins',
  '1988-04-14',
  'MRN-9023811',
  'BlueCross Health Premier (#88210-A)',
  'a1b2c3d4-0000-0000-0000-000000000001'
);

-- Use a variable for cleaner inserts below
do $$ declare patient_id text := 'REPLACE_WITH_YOUR_CLERK_USER_ID'; begin

-- ── Lab Reports ───────────────────────────────────────────────

-- Comprehensive Metabolic Panel
insert into lab_reports (id, patient_id, title, date, short_date, order_number, lab_location, status, status_text)
values ('b1000000-0000-0000-0000-000000000001', patient_id, 'Comprehensive Metabolic Panel', '2023-10-05', 'Oct 05, 2023', '88291', 'Central Lab Service', 'review', 'Review');

insert into test_parameters (report_id, name, value, unit, marker_percentage, status, status_label, low_label, normal_label, high_label, reference_range) values
('b1000000-0000-0000-0000-000000000001', 'Glucose (Fasting)',  '94',   'mg/dL',   45, 'normal',  'Normal',  'Low',    'Normal (70-99)',  'High', '70 - 99 mg/dL'),
('b1000000-0000-0000-0000-000000000001', 'A1C Level',          '5.4',  '%',       38, 'normal',  'Normal',  'Normal', 'Pre-diabetic',   'High', '< 5.7 %'),
('b1000000-0000-0000-0000-000000000001', 'Sodium',             '140',  'mmol/L',  null, 'normal', 'Normal',  null,    null,             null,   '135 - 145 mmol/L'),
('b1000000-0000-0000-0000-000000000001', 'Potassium',          '4.2',  'mmol/L',  null, 'optimal','Optimal', null,    null,             null,   '3.5 - 5.1 mmol/L'),
('b1000000-0000-0000-0000-000000000001', 'Calcium',            '9.6',  'mg/dL',   null, 'normal', 'Normal',  null,    null,             null,   '8.5 - 10.2 mg/dL'),
('b1000000-0000-0000-0000-000000000001', 'Creatinine',         '0.88', 'mg/dL',   null, 'optimal','Optimal', null,    null,             null,   '0.6 - 1.1 mg/dL');

insert into physician_notes (report_id, doctor_id, message, created_at) values
('b1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001',
 '"Your levels look stable compared to last month. The glucose and A1C are right where we want them to be for your age and activity level. Keep focusing on the balanced diet we discussed."',
 '2023-10-05 09:41:00+00');

-- Blood Count (CBC)
insert into lab_reports (id, patient_id, title, date, short_date, order_number, lab_location, status, status_text)
values ('b1000000-0000-0000-0000-000000000002', patient_id, 'Blood Count (CBC)', '2023-10-12', 'Oct 12, 2023', '89012', 'Central Lab Service', 'normal', 'Normal');

insert into test_parameters (report_id, name, value, unit, marker_percentage, status, status_label, low_label, normal_label, high_label, reference_range) values
('b1000000-0000-0000-0000-000000000002', 'White Blood Cell (WBC)', '6.8',  'x10^3/uL', 50, 'normal',  'Normal',  'Low', 'Normal (4.5-11.0)', 'High', '4.5 - 11.0 x10^3/uL'),
('b1000000-0000-0000-0000-000000000002', 'Red Blood Cell (RBC)',   '4.6',  'x10^6/uL', 52, 'normal',  'Normal',  'Low', 'Normal (4.0-5.2)',  'High', '4.0 - 5.2 x10^6/uL'),
('b1000000-0000-0000-0000-000000000002', 'Hemoglobin',             '13.8', 'g/dL',     null, 'optimal','Optimal', null, null,               null,   '12.0 - 15.5 g/dL'),
('b1000000-0000-0000-0000-000000000002', 'Platelets',              '245',  'x10^3/uL', null, 'normal', 'Normal',  null, null,               null,   '150 - 450 x10^3/uL');

insert into physician_notes (report_id, doctor_id, message, created_at) values
('b1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001',
 '"Complete blood count results are overall excellent. Red cells and white cells are in healthy target ranges."',
 '2023-10-12 14:15:00+00');

-- Lipid Panel
insert into lab_reports (id, patient_id, title, date, short_date, order_number, lab_location, status, status_text)
values ('b1000000-0000-0000-0000-000000000003', patient_id, 'Lipid Panel', '2023-09-28', 'Sep 28, 2023', '87102', 'Central Lab Service', 'normal', 'Normal');

insert into test_parameters (report_id, name, value, unit, marker_percentage, status, status_label, low_label, normal_label, high_label, reference_range) values
('b1000000-0000-0000-0000-000000000003', 'Total Cholesterol',    '178', 'mg/dL', 42,   'normal',  'Desirable', 'Optimal', 'Desirable (<200)', 'High', '< 200 mg/dL'),
('b1000000-0000-0000-0000-000000000003', 'HDL (Good Cholesterol)','58', 'mg/dL', null, 'optimal', 'Optimal',   null,      null,              null,   '> 50 mg/dL'),
('b1000000-0000-0000-0000-000000000003', 'LDL (Calculated)',     '98', 'mg/dL', null, 'normal',  'Optimal',   null,      null,              null,   '< 100 mg/dL'),
('b1000000-0000-0000-0000-000000000003', 'Triglycerides',        '110','mg/dL', null, 'normal',  'Normal',    null,      null,              null,   '< 150 mg/dL');

insert into physician_notes (report_id, doctor_id, message, created_at) values
('b1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001',
 '"Lipid levels show fantastic cardiovascular health. LDL is below 100 mg/dL and HDL remains protective."',
 '2023-09-29 10:05:00+00');

-- Urinalysis
insert into lab_reports (id, patient_id, title, date, short_date, order_number, lab_location, status, status_text)
values ('b1000000-0000-0000-0000-000000000004', patient_id, 'Urinalysis Comprehensive', '2023-08-15', 'Aug 15, 2023', '85204', 'Central Lab Service', 'normal', 'Normal');

insert into test_parameters (report_id, name, value, unit, status, status_label, reference_range) values
('b1000000-0000-0000-0000-000000000004', 'Protein',        'Negative', '', 'normal', 'Normal', 'Negative'),
('b1000000-0000-0000-0000-000000000004', 'Glucose (Urine)','Negative', '', 'normal', 'Normal', 'Negative'),
('b1000000-0000-0000-0000-000000000004', 'pH',             '6.2',      '', 'normal', 'Normal', '4.5 - 8.0');

insert into physician_notes (report_id, doctor_id, message, created_at) values
('b1000000-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001',
 '"Urinalysis is clear with no signs of infection or renal distress."',
 '2023-08-16 11:20:00+00');

-- ── Appointments ──────────────────────────────────────────────
insert into appointments (patient_id, doctor_id, date, time, location, type, status) values
(patient_id, 'a1b2c3d4-0000-0000-0000-000000000001', '2023-11-14', '10:30 AM', 'Central Health Medical Center - Suite 402', 'Routine Annual Checkup & Lab Review', 'upcoming'),
(patient_id, 'a1b2c3d4-0000-0000-0000-000000000002', '2023-12-02', '02:00 PM', 'Heart & Vascular Institute', 'Preventive ECG & Heart Rate Follow-up', 'upcoming'),
(patient_id, 'a1b2c3d4-0000-0000-0000-000000000001', '2023-10-04', '09:00 AM', 'Central Health Medical Center', 'Metabolic Panel Blood Draw', 'completed');

-- ── Medications ───────────────────────────────────────────────
insert into medications (patient_id, prescribing_doctor_id, name, dosage, frequency, started_at, notes) values
(patient_id, 'a1b2c3d4-0000-0000-0000-000000000001', 'Vitamin D3',    '2000 IU', 'Once daily',      '2023-01-01', 'Supplement for vitamin D deficiency'),
(patient_id, 'a1b2c3d4-0000-0000-0000-000000000001', 'Metformin',     '500mg',   'Twice daily',     '2022-06-01', 'Preventive — borderline fasting glucose in 2022'),
(patient_id, 'a1b2c3d4-0000-0000-0000-000000000001', 'Levothyroxine', '50mcg',   'Once daily (AM)', '2021-03-15', 'Hypothyroidism management');

-- ── Messages ─────────────────────────────────────────────────
insert into messages (patient_id, sender_type, sender_id, sender_name, sender_role, sender_avatar, text, is_read, created_at) values
(patient_id, 'doctor', 'a1b2c3d4-0000-0000-0000-000000000001', 'Dr. Emily Chen', 'Primary Physician',
 'https://lh3.googleusercontent.com/aida-public/AB6AXuACHD56WKKWrA-3XAFPd1uAw-A_aQ8Zc0dq2GEtceVMRaak8tJZHpXaCH5DSvkw7xcZlsHYCufvXjth8ORUi9PX9qGVCrPLh6ubXMkDcxHG51TofhxflTZFLcFMtZ4gxFC5Sh2UNp-N7gxD-ZQwrhP9uGQnIPBqqbFFUkD2Jl8qd1ZF6UrDbt3MUxDMbnHQ9Ts-7KhFc12-mk3UcaOd1S_ilTgstXnlKNfmk5rzfDbrCbvytuMVWQ8w8w',
 'Hi Sarah, I reviewed your Metabolic Panel from Oct 5th. Your glucose and A1C are in great shape! Let me know if you have any questions before our next appointment in November.',
 true, '2023-10-05 09:41:00+00');

-- ── Historical Trends ─────────────────────────────────────────
insert into historical_trends (patient_id, date, glucose, a1c, sodium, potassium) values
(patient_id, 'May 2023', 98, 5.6, 138, 4.0),
(patient_id, 'Jun 2023', 96, 5.5, 139, 4.1),
(patient_id, 'Aug 2023', 95, 5.5, 141, 4.3),
(patient_id, 'Sep 2023', 93, 5.4, 139, 4.1),
(patient_id, 'Oct 2023', 94, 5.4, 140, 4.2);

-- ── Notifications ─────────────────────────────────────────────
insert into notifications (patient_id, title, description, type, is_read, created_at) values
(patient_id, 'Lab Report Ready',            'Comprehensive Metabolic Panel results processed by Central Lab Service.', 'lab',         false, now() - interval '2 hours'),
(patient_id, 'Message from Dr. Emily Chen', '"Your levels look stable compared to last month..."',                     'message',     false, now() - interval '4 hours'),
(patient_id, 'Upcoming Appointment Reminder','Routine Annual Checkup on Nov 14 at 10:30 AM.',                          'appointment', true,  now() - interval '1 day');

end $$;
